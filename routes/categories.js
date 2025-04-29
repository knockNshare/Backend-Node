const express = require('express');
const router = express.Router();
const con = require('../config/db');





router.get('/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT p.*, u.name AS proposer_name, u.email AS proposer_email
        FROM propositions p
        JOIN users u ON p.proposer_id = u.id
        WHERE p.category_id = ?`;

    con.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching category propositions.' });
        if (results.length === 0) return res.status(404).json({ message: 'No propositions found.' });
        res.json({ message: 'Category propositions', data: results });
    });
});

// Récupérer toutes les catégories
router.get('/', (req, res) => {
    const sql = 'SELECT id, service_type FROM categories';

    con.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        res.json(results);
    });
});

// Supprimer une catégorie
router.delete('/:id', (req, res) => {
    const categoryId = req.params.id;

    if (!categoryId) {
        return res.status(400).json({ error: "Category ID is required." });
    }

    const query = `DELETE FROM categories WHERE id = ?`;

    con.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error("Error deleting category:", err);
            return res.status(500).json({
                error: "An error occurred while deleting the category."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Category not found."
            });
        }

        res.json({
            message: "Category successfully deleted."
        });
    });
});

module.exports = router;