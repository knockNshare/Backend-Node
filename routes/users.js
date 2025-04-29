// /routes/users.js
const express = require('express');
const router = express.Router();
const con = require('../config/db');



router.get('/:id', (req, res) => {
    const userId = req.params.id;
    const query = `
        SELECT p.*, c.service_type AS category_name
        FROM propositions p
        JOIN categories c ON p.category_id = c.id
        WHERE p.proposer_id = ?`;

    con.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching propositions.' });
        res.json({ message: 'User propositions', data: results });
    });
});

// Récupérer les coordonnées d'un utilisateur
router.get('/:id/contact', (req, res) => {
    con.query('SELECT phone_number, email FROM users WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur récupération coordonnées' });
        if (results.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json({ message: 'Coordonnées récupérées', data: results[0] });
    });
});

// Récupérer city_id d'un utilisateur
router.get('/city/:id', (req, res) => {
    con.query('SELECT city_id FROM users WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur récupération city_id' });
        if (results.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json({ message: 'City ID récupéré', data: results[0] });
    });
});

// Récupérer tous les utilisateurs avec pagination
router.get('/', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `SELECT id, name, email, phone_number, role, city_id, created_at, updated_at, quartier_id FROM users LIMIT ? OFFSET ?`;
    con.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur récupération utilisateurs' });
        res.json({
            message: 'Liste des utilisateurs',
            data: results,
            pagination: {
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            }
        });
    });
});

module.exports = router;