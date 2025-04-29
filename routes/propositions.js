// /routes/propositions.js
const express = require('express');
const router = express.Router();
const con = require('../config/db');
const Fuse = require('fuse.js');

router.get('/search', (req, res) => {
    const { service_type, user_id, keyword } = req.query;
    if (!user_id) return res.status(400).json({ error: 'Service type and user_id are required' });

    const getUserLocationSQL = `
        SELECT u.city_id, c.latitude AS user_latitude, c.longitude AS user_longitude
        FROM users u
        JOIN cities c ON u.city_id = c.id
        WHERE u.id = ?
    `;

    con.query(getUserLocationSQL, [user_id], (err, userResults) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        if (userResults.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        const { user_latitude, user_longitude } = userResults[0];
        const sql = `
            SELECT p.*, 
                   ( 6371 * acos( cos( radians(?) ) * cos( radians(c.latitude) ) * cos( radians(c.longitude) - radians(?) ) + sin( radians(?) ) * sin( radians(c.latitude) ) ) ) AS distance
            FROM propositions p
            JOIN categories cat ON p.category_id = cat.id
            LEFT JOIN users u ON p.proposer_id = u.id
            LEFT JOIN cities c ON u.city_id = c.id
            WHERE cat.service_type = ? AND p.is_active = true
        `;

        const queryParams = [user_latitude, user_longitude, user_latitude, service_type];
        con.query(sql, queryParams, (err, results) => {
            if (err) return res.status(500).json({ error: 'Erreur serveur' });

            if (keyword && keyword.trim() !== '') {
                const fuse = new Fuse(results, {
                    keys: ['title', 'description'],
                    threshold: 0.4,
                    includeScore: true,
                    distance: 100,
                    minMatchCharLength: 2
                });
                const fuzzyResults = fuse.search(keyword);
                const matched = fuzzyResults.map(r => r.item);
                return res.status(200).json(matched);
            }

            res.status(200).json(results);
        });
    });
});

router.post('/', (req, res) => {
    const { category_id, proposer_id, title, description } = req.body;
    if (!category_id || !proposer_id || !title || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const query = `
        INSERT INTO propositions (category_id, proposer_id, title, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`;

    con.query(query, [category_id, proposer_id, title, description], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error adding proposition.' });
        res.status(201).json({
            message: 'Proposition created',
            data: { id: results.insertId, category_id, proposer_id, title, description, is_active: true, created_at: new Date(), updated_at: new Date() }
        });
    });
});

router.put('/:id', (req, res) => {
    const propositionId = req.params.id;
    const { category_id, proposer_id, title, description, is_active } = req.body;
    if (!category_id && !proposer_id && !title && !description && is_active === undefined) {
        return res.status(400).json({ error: 'No fields provided to update.' });
    }
    let fields = [], values = [];
    if (category_id) fields.push('category_id = ?') && values.push(category_id);
    if (proposer_id) fields.push('proposer_id = ?') && values.push(proposer_id);
    if (title) fields.push('title = ?') && values.push(title);
    if (description) fields.push('description = ?') && values.push(description);
    if (is_active !== undefined) fields.push('is_active = ?') && values.push(is_active);
    values.push(propositionId);

    const query = `UPDATE propositions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    con.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error updating proposition.' });
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Proposition not found.' });
        res.json({ message: 'Proposition updated', updatedFields: req.body });
    });
});

router.delete('/:id', (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID required.' });
    con.query('DELETE FROM propositions WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error deleting proposition.' });
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Not found.' });
        res.json({ message: 'Deleted successfully' });
    });
});



router.get('/', (req, res) => {
    const query = `
        SELECT p.*, c.service_type AS category_name, u.name AS proposer_name, u.email AS proposer_email
        FROM propositions p
        JOIN categories c ON p.category_id = c.id
        JOIN users u ON p.proposer_id = u.id`;

    con.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching propositions.' });
        res.json({ message: 'All propositions', data: results });
    });
});

router.get('/searchText', async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).send('Search term is required');
    try {
        const query = `SELECT * FROM propositions WHERE title LIKE ? OR description LIKE ?;`;
        const [rows] = await con.promise().query(query, [`%${keyword}%`, `%${keyword}%`]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching propositions:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
