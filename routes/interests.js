// /routes/interests.js
const express = require('express');
const router = express.Router();
const con = require('../config/db');

// Ajouter un intérêt et envoyer une notif en temps réel
router.post('/', (req, res) => {
    const { proposition_id, interested_user_id } = req.body;
    if (!proposition_id || !interested_user_id) return res.status(400).json({ error: 'Proposition ID et utilisateur requis.' });

    con.query('SELECT name FROM users WHERE id = ?', [interested_user_id], (err, userResult) => {
        if (err || userResult.length === 0) return res.status(500).json({ error: 'Utilisateur non trouvé' });
        const interested_user_name = userResult[0].name;

        const insertInterestSQL = `INSERT INTO interests (proposition_id, interested_user_id, start_date, status) VALUES (?, ?, NOW(), 'pending')`;
        con.query(insertInterestSQL, [proposition_id, interested_user_id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Erreur insertion intérêt' });
            const interestId = result.insertId;

            con.query('SELECT proposer_id, title FROM propositions WHERE id = ?', [proposition_id], (err, propResult) => {
                if (err || propResult.length === 0) return res.status(404).json({ error: 'Proposition non trouvée' });

                const { proposer_id, title } = propResult[0];
                const notifMessage = `${interested_user_name} est intéressé(e) par votre offre : ${title}`;
                const insertNotifSQL = `INSERT INTO notifications (user_id, type, message, related_entity_id) VALUES (?, ?, ?, ?)`;
                con.query(insertNotifSQL, [proposer_id, 'interest_request', notifMessage, interestId], (err, notifResult) => {
                    if (err) return res.status(500).json({ error: 'Erreur enregistrement notification' });

                    const io = req.app.get("socketio");
                    io.emit(`notification-${proposer_id}`, {
                        id: notifResult.insertId,
                        message: notifMessage,
                        related_entity_id: interestId,
                        type: 'interest_request'
                    });
                    res.status(201).json({ message: 'Demande d\'intérêt envoyée avec succès.' });
                });
            });
        });
    });
});

// Modifier un intérêt (accepté/refusé) + notifie l'intéressé
router.put('/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Statut invalide' });

    con.query('UPDATE interests SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erreur mise à jour intérêt' });

        con.query('SELECT interested_user_id, proposition_id FROM interests WHERE id = ?', [id], (err, interestResults) => {
            if (err || interestResults.length === 0) return res.status(500).json({ error: 'Erreur récupération données intérêt' });
            const { interested_user_id, proposition_id } = interestResults[0];

            con.query('SELECT proposer_id FROM propositions WHERE id = ?', [proposition_id], (err, proposerResults) => {
                if (err || proposerResults.length === 0) return res.status(500).json({ error: 'Erreur récupération proposeur' });

                const proposer_id = proposerResults[0].proposer_id;
                con.query('SELECT name, email, phone_number FROM users WHERE id = ?', [proposer_id], (err, userResult) => {
                    if (err || userResult.length === 0) return res.status(500).json({ error: 'Erreur récupération infos proposeur' });

                    const { name, email, phone_number } = userResult[0];
                    const message = status === 'accepted'
                        ? `🎉 ${name} a accepté votre demande. Contacts : 📧 ${email} 📞 ${phone_number}`
                        : `❌ ${name} a refusé votre demande.`;

                    con.query('INSERT INTO notifications (user_id, type, message, related_entity_id) VALUES (?, ?, ?, ?)',
                        [interested_user_id, `interest_${status}`, message, proposition_id], (err, notifResult) => {
                            if (err) return res.status(500).json({ error: 'Erreur notification' });

                            const io = req.app.get("socketio");
                            io.emit(`notification-${interested_user_id}`, {
                                id: notifResult.insertId,
                                message,
                                related_entity_id: proposition_id,
                                type: `interest_${status}`
                            });
                            res.json({ message: `Demande ${status} avec succès.` });
                        });
                });
            });
        });
    });
});

// Intérêts reçus par un user (en tant que proposeur)
router.get('/received/:id', (req, res) => {
    const query = `
        SELECT i.*, p.title AS proposition_title, p.description AS proposition_description,
               u.name AS interested_user_name, u.email AS interested_user_email
        FROM interests i
        JOIN propositions p ON i.proposition_id = p.id
        JOIN users u ON i.interested_user_id = u.id
        WHERE p.proposer_id = ?`;

    con.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur récupération intérêts reçus' });
        res.json({ message: 'Intérêts reçus', data: results });
    });
});

// Modifier un intérêt par utilisateur
router.put('/users/:id', (req, res) => {
    const { start_date, end_date, status } = req.body;
    let fields = [], values = [];
    if (start_date) fields.push("start_date = ?") && values.push(start_date);
    if (end_date) fields.push("end_date = ?") && values.push(end_date);
    if (status) fields.push("status = ?") && values.push(status);
    values.push(req.params.id);

    if (!fields.length) return res.status(400).json({ error: 'Aucun champ à modifier' });

    const query = `UPDATE interests SET ${fields.join(', ')}, updated_at = NOW() WHERE interested_user_id = ?`;
    con.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: 'Erreur mise à jour intérêts' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Aucun intérêt trouvé' });
        res.json({ message: 'Mise à jour réussie' });
    });
});

// Supprimer tous les intérêts d'un utilisateur
router.delete('/users/:id', (req, res) => {
    con.query('DELETE FROM interests WHERE interested_user_id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erreur suppression intérêts' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Aucun intérêt trouvé' });
        res.json({ message: 'Intérêts supprimés', deletedCount: result.affectedRows });
    });
});

// Intérêts envoyés (avec infos du proposeur)
router.get('/sent/:userId', (req, res) => {
    const query = `
        SELECT i.id, i.status, p.title AS proposition_title, 
               u.email AS proposer_email, u.phone_number AS proposer_phone
        FROM interests i
        JOIN propositions p ON i.proposition_id = p.id
        JOIN users u ON p.proposer_id = u.id
        WHERE i.interested_user_id = ?`;

    con.query(query, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur récupération intérêts envoyés' });

        const formattedResults = results.map(interest => ({
            ...interest,
            proposer_contact: {
                email: interest.proposer_email,
                phone: interest.proposer_phone
            }
        }));

        res.json({ data: formattedResults });
    });
});

module.exports = router;
