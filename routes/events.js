const express = require('express');
const router = express.Router();
const con = require('../config/db');
const fetch = require('node-fetch'); 
const Fuse = require('fuse.js');     

// ----------------------------
// Validation d'une image
// ----------------------------
router.get('/validate-image', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) throw new Error('Invalid image');
        res.status(200).json({ valid: true });
    } catch (error) {
        res.status(400).json({ valid: false, error: 'Invalid image URL' });
    }
});

// ----------------------------
// Création d'un événement
// ----------------------------
router.post('/', (req, res) => {
    const { title, description, date, category, imageURL, address, city_id, creator_id } = req.body;
    const sql = 'INSERT INTO events (title, description, date, category, imageURL, address, city_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?,?)';
    con.query(sql, [title, description, date, category, imageURL, address, city_id, creator_id], (err, result) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
        }
        res.status(201).json({ message: 'Événement créé avec succès', event_id: result.insertId });
    });
});

// ----------------------------
// Recherche événement basique avec Levenshtein
// ----------------------------
router.get('/search-levenshtein', (req, res) => {
    const { search } = req.query;
    if (!search) return res.status(400).json({ error: "Veuillez fournir un terme de recherche." });

    const sql = `
        SELECT *,
            LEVENSHTEIN(LOWER(title), LOWER(?)) AS distance_title,
            LEVENSHTEIN(LOWER(description), LOWER(?)) AS distance_description
        FROM events
        WHERE 
            LEVENSHTEIN(LOWER(title), LOWER(?)) <= 3 
            OR LEVENSHTEIN(LOWER(description), LOWER(?)) <= 3
        ORDER BY distance_title ASC, distance_description ASC
    `;

    con.query(sql, [search, search, search, search], (err, results) => {
        if (err) {
            console.error("Erreur SQL lors de la recherche d'événements :", err);
            return res.status(500).json({ error: "Erreur lors de la recherche d'événements." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Aucun événement trouvé." });
        }

        res.status(200).json(results);
    });
});

// ----------------------------
// Recherche avancée avec Fuse.js
// ----------------------------
router.get('/search', (req, res) => {
    const { keyword, categories, cityId } = req.query;
    let sql = 'SELECT * FROM events WHERE 1=1';
    let filterConditions = [];

    if (categories && categories.trim() !== "") {
        const categoriesArray = categories.split(',');
        filterConditions.push(`category IN (${categoriesArray.map(c => `'${c}'`).join(',')})`);
    }
    if (cityId && cityId.trim() !== "") {
        filterConditions.push(`city_id = ${cityId}`);
    }
    if (filterConditions.length > 0) {
        sql += ' AND ' + filterConditions.join(' AND ');
    }

    con.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur SQL (fetch events):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (keyword && keyword.trim() !== "") {
            const fuseOptions = {
                keys: ['title', 'description'],
                threshold: 0.4,
                distance: 100,
                includeScore: true,
                minMatchCharLength: 2
            };
            const fuse = new Fuse(results, fuseOptions);
            const fuzzyResults = fuse.search(keyword);
            const matchedEvents = fuzzyResults.map(result => result.item);
            return res.status(200).json(matchedEvents);
        }

        res.status(200).json(results);
    });
});

// ----------------------------
// Récupérer tous les événements
// ----------------------------
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM events';
    con.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des événements.' });
        }
        res.json(results);
    });
});

// ----------------------------
// Modifier un événement
// ----------------------------
router.put('/:id', (req, res) => {
    const eventId = req.params.id;
    const { title, description, date, category, imageURL, address, creator_id } = req.body;

    const sql = `
        UPDATE events 
        SET title = ?, description = ?, date = ?, category = ?, imageURL = ?, address = ?
        WHERE id = ? AND creator_id = ?
    `;
    con.query(sql, [title, description, date, category, imageURL, address, eventId, creator_id], (err, result) => {
        if (err) {
            console.error('Erreur SQL (modification):', err);
            return res.status(500).json({ error: 'Erreur lors de la modification de l\'événement.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Événement introuvable ou non autorisé.' });
        }
        res.status(200).json({ message: 'Événement modifié avec succès.' });
    });
});

// ----------------------------
// Détails d'un événement
// ----------------------------
router.get('/:id', (req, res) => {
    const eventId = req.params.id;
    const sql = 'SELECT * FROM events WHERE id = ?';
    con.query(sql, [eventId], (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération de l\'événement.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Événement introuvable.' });
        }
        res.status(200).json(results[0]);
    });
});

// ----------------------------
// Supprimer un événement
// ----------------------------
router.delete('/:id', (req, res) => {
    const eventId = req.params.id;
    const sql = 'DELETE FROM events WHERE id = ?';
    con.query(sql, [eventId], (err, result) => {
        if (err) {
            console.error('Erreur SQL (suppression):', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Événement introuvable.' });
        }
        res.status(200).json({ message: 'Événement supprimé avec succès.' });
    });
});

// ----------------------------
// Événements par utilisateur
// ----------------------------
router.get('/user/:user_id', (req, res) => {
    const userId = req.params.user_id;
    const sqlCreator = 'SELECT * FROM events WHERE creator_id = ?';
    const sqlParticipant = 'SELECT e.* FROM events e JOIN participants p ON e.id = p.event_id WHERE p.user_id = ?';

    con.query(sqlCreator, [userId], (err, creatorEvents) => {
        if (err) {
            console.error('Erreur SQL (creator events):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        con.query(sqlParticipant, [userId], (err, participantEvents) => {
            if (err) {
                console.error('Erreur SQL (participant events):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            const response = {
                creatorEvents,
                participantEvents
            };

            if (creatorEvents.length === 0 && participantEvents.length === 0) {
                return res.status(404).json({ error: 'Aucun événement trouvé pour cet utilisateur' });
            }

            res.status(200).json(response);
        });
    });
});

// ----------------------------
// Événements par région (city_id)
// ----------------------------
router.get('/region/:city_id', (req, res) => {
    const cityId = req.params.city_id;
    const sql = 'SELECT * FROM events WHERE city_id = ?';

    con.query(sql, [cityId], (err, events) => {
        if (err) {
            console.error('Erreur SQL (fetch events):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.status(200).json(events.length ? events : []);
    });
});

// ----------------------------
// Participation à un événement
// ----------------------------
router.post('/participate', (req, res) => {
    const { event_id, user_id } = req.body;

    if (!event_id || !user_id) {
        return res.status(400).json({ error: 'Event ID et User ID requis' });
    }

    const checkSql = 'SELECT * FROM participants WHERE event_id = ? AND user_id = ?';
    con.query(checkSql, [event_id, user_id], (err, results) => {
        if (err) {
            console.error('Erreur SQL (check participation):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Déjà participant' });
        }

        const insertSql = 'INSERT INTO participants (event_id, user_id, status) VALUES (?, ?, ?)';
        con.query(insertSql, [event_id, user_id, 'participating'], (err) => {
            if (err) {
                console.error('Erreur SQL (insert participation):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.status(201).json({ message: 'Participation enregistrée' });
        });
    });
});

// ----------------------------
// Quitter un événement
// ----------------------------
router.delete('/leave', (req, res) => {
    const { event_id, user_id } = req.body;

    if (!event_id || !user_id) {
        return res.status(400).json({ error: 'Event ID et User ID requis' });
    }

    const checkSql = 'SELECT * FROM participants WHERE event_id = ? AND user_id = ?';
    con.query(checkSql, [event_id, user_id], (err, results) => {
        if (err) {
            console.error('Erreur SQL (check participation):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Non participant à cet événement' });
        }

        const deleteSql = 'DELETE FROM participants WHERE event_id = ? AND user_id = ?';
        con.query(deleteSql, [event_id, user_id], (err) => {
            if (err) {
                console.error('Erreur SQL (delete participation):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.status(200).json({ message: 'Participation annulée' });
        });
    });
});

module.exports = router;