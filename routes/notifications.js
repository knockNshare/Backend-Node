const express = require('express');
const router = express.Router();
const con = require('../config/db');

// Créer une notification
router.post('/', (req, res) => { 
        const { user_id, type, message, related_entity_id } = req.body;
    
        if (!user_id || !type || !message) {
            return res.status(400).json({ error: "Champs obligatoires manquants." });
        }
    
        const insertNotificationQuery = `
            INSERT INTO notifications (user_id, type, message, related_entity_id, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
    
        con.query(insertNotificationQuery, [user_id, type, message, related_entity_id], (err, result) => {
            if (err) return res.status(500).json({ error: "Erreur serveur lors de l'ajout de la notification." });
    
            const notificationData = {
                id: result.insertId,
                user_id,
                type,
                message,
                related_entity_id,
            };
    
            io.emit(`notification_${user_id}`, notificationData); // 🔥 Envoie la notif en temps réel
            res.status(201).json({ message: "Notification envoyée avec succès.", notificationData });
        });
    });
    

router.get('/notifications/:userId', (req, res) => {
        const userId = req.params.userId;
    
        if (!userId) {
            return res.status(400).json({ error: "userId est requis." });
        }
    
        const sql = "SELECT * FROM notifications WHERE user_id = ?";
        con.query(sql, [userId], (err, result) => {
            if (err) {
                console.error("Erreur récupération des notifications :", err);
                return res.status(500).json({ error: "Erreur interne du serveur." });
            }
    
            if (result.length === 0) {
                return res.json([]); // 🔥 Retourne une liste vide au lieu d'une erreur 404
            }
    
            res.json(result);
        });
    });


// Récupérer notifications utilisateur
router.get('/:userId', (req, res) => { /* Ton code GET /notifications/:userId ici */ });

// Supprimer une notification
router.delete('/:id', (req, res) => { 
    const notificationId = req.params.id;

    const deleteNotifSQL = `DELETE FROM notifications WHERE id = ?`;

    con.query(deleteNotifSQL, [notificationId], (err, result) => {
        if (err) {
            console.error("Erreur lors de la suppression de la notification :", err);
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }

        if (result.affectedRows > 0) {
            console.log(`🗑️ Notification ${notificationId} supprimée.`);
            res.json({ message: "Notification supprimée avec succès." });
        } else {
            res.status(404).json({ error: "Notification non trouvée." });
        }
    });
});

// Supprimer toutes les notifications d'un utilisateur
router.delete('/all/:userId', (req, res) => { 
    const userId = req.params.userId;

    const deleteAllNotifSQL = `DELETE FROM notifications WHERE user_id = ?`;

    con.query(deleteAllNotifSQL, [userId], (err, result) => {
        if (err) {
            console.error("Erreur lors de la suppression des notifications :", err);
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }

        console.log(`🗑️ Toutes les notifications de l'utilisateur ${userId} supprimées.`);
        res.json({ message: "Toutes les notifications ont été supprimées." });
    });
});

module.exports = router;