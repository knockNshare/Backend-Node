const express = require('express');
const router = express.Router();
const con = require('../config/db');

// /api/auth/signup
router.post('/signup', (req, res) => {
    const { name, email, phone_number, password, city_id,quartier_id } = req.body;

    if (!name || !email || !phone_number || !password || !city_id || !quartier_id)  {
        return res.status(400).json({ error: 'Tous les champs requis doivent être remplis.' });
    }

    // Vérifier si l'email existe déjà
    const checkEmailQuery = 'SELECT email FROM users WHERE email = ?';
    con.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error('Erreur SQL lors de la vérification de l\'email :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length > 0) {
            return res.status(409).json({ error: 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.' });
        }

        // Insérer le nouvel utilisateur (sans hashage)
        const insertUserQuery = 'INSERT INTO users (name, email, phone_number, password, city_id,quartier_id) VALUES (?, ?, ?, ?, ?,?)';
        con.query(insertUserQuery, [name, email, phone_number, password, city_id,quartier_id], (err, result) => {
            if (err) {
                console.error('Erreur SQL lors de l\'insertion de l\'utilisateur :', err);
                return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
            }

            res.status(201).json({ message: 'Utilisateur créé avec succès' });
        });
    });

});

// /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    con.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length > 0) {
            res.status(200).json({ message: 'Connexion réussie', user: results[0] });
        } else {
            res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
    });
});

module.exports = router;

    