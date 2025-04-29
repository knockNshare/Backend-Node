// /routes/signalements.js
const express = require('express');
const router = express.Router();
const con = require('../config/db');

// Ajouter un signalement avec notif + websocket si critique
router.post('/', (req, res) => {
    const { user_id, categorie, description, critique, quartier } = req.body;
    if (!user_id || !categorie || !description) {
        return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    const sql = `INSERT INTO signalements (user_id, categorie, description, critique, quartier) VALUES (?, ?, ?, ?, ?)`;
    con.query(sql, [user_id, categorie, description, critique, quartier], (err, result) => {
        if (err) return res.status(500).json({ error: "Erreur SQL." });

        const newSignalement = {
            id: result.insertId,
            user_id,
            categorie,
            description,
            critique,
            quartier,
            date_creation: new Date().toISOString()
        };

        const io = req.app.get("socketio");
        io.emit("new-signalement", newSignalement);

        if (critique) {
            const notifMessage = `⚠️ Problème signalé dans votre quartier : ${description}`;
            con.query("SELECT id FROM users", (err, users) => {
                if (err) return res.status(500).json({ error: "Erreur récupération utilisateurs." });

                users.forEach(user => {
                    con.query(
                        "INSERT INTO notifications (user_id, type, message, related_entity_id) VALUES (?, ?, ?, ?)",
                        [user.id, "danger_alert", notifMessage, result.insertId]
                    );

                    io.to(`user_${user.id}`).emit(`notification-${user.id}`, {
                        id: result.insertId,
                        message: notifMessage,
                        type: "danger_alert",
                        related_entity_id: result.insertId
                    });
                });

                res.status(201).json({ message: "Signalement ajouté et notifications envoyées." });
            });
        } else {
            res.status(201).json({ message: "Signalement ajouté." });
        }
    });
});

// Tous les signalements
router.get('/', (req, res) => {
    con.query('SELECT * FROM signalements ORDER BY date_creation DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur SQL.' });
        res.json({ signalements: results });
    });
});

// Signalements d'un utilisateur spécifique
router.get('/utilisateur/:userId', (req, res) => {
    con.query('SELECT * FROM signalements WHERE user_id = ? ORDER BY date_creation DESC', [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur SQL.' });
        res.json({ signalements: results });
    });
});

// Marquer comme résolu
router.put('/:id/resoudre', (req, res) => {
    const { id } = req.params;
    const checkSql = 'SELECT user_id FROM signalements WHERE id = ?';
    con.query(checkSql, [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: "Signalement introuvable." });

        con.query('UPDATE signalements SET resolu = TRUE WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: "Erreur lors de la mise à jour." });
            con.query('SELECT * FROM signalements WHERE id = ?', [id], (err, updated) => {
                if (err) return res.status(500).json({ error: "Erreur récupération signalement mis à jour." });
                res.json({ message: "Signalement résolu.", signalement: updated[0] });
            });
        });
    });
});

module.exports = router;
