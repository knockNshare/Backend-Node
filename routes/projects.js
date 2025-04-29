const express = require('express');
const router = express.Router();
const con = require('../config/db');



// Créer un projet
router.post('/', (req, res) => {
    const { title, description, category, author_id, deadline } = req.body;

    if (!title || !description || !category || !author_id || !deadline) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }

    // Récupérer le quartier de l'auteur
    con.query("SELECT quartier_id FROM users WHERE id = ?", [author_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (results.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });

        const quartierId = results[0].quartier_id;

        const sql = `
            INSERT INTO projects (title, description, category, author_id, deadline, quartier_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        con.query(sql, [title, description, category, author_id, deadline, quartierId], (err, result) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur serveur lors de la création du projet." });
            }
            res.status(201).json({ message: "Projet créé avec succès", project_id: result.insertId });
        });
    });
});



// Supprimer un projet (seulement si l'utilisateur est l'auteur)
router.delete('/:id', (req, res) => {
    const projectId = req.params.id;
    const { user_id } = req.body;

    // Vérifier si l'utilisateur est bien l'auteur du projet
    con.query("SELECT author_id FROM projects WHERE id = ?", [projectId], (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Projet introuvable." });
        }

        if (results[0].author_id !== user_id) {
            return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer ce projet." });
        }

        // Suppression du projet
        con.query("DELETE FROM projects WHERE id = ?", [projectId], (err) => {
            if (err) return res.status(500).json({ error: "Erreur lors de la suppression du projet." });
            return res.status(200).json({ message: "Projet supprimé avec succès." });
        });
    });
});



// Modifier un projet (seulement si l'utilisateur est l'auteur)
router.put('/:id', (req, res) => {

    const projectId = req.params.id;
    const { title, description, category, deadline, user_id } = req.body;
    
    con.query("SELECT author_id FROM projects WHERE id = ?", [projectId], (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (results.length === 0) return res.status(404).json({ error: "Projet introuvable." });

        if (Number(results[0].author_id) !== Number(user_id)) {
            return res.status(403).json({ error: "Accès interdit. Ce projet ne vous appartient pas." });
        }

        con.query(
            "UPDATE projects SET title = ?, description = ?, category = ?, deadline = ? WHERE id = ?",
            [title, description, category, deadline, projectId],
            (err) => {
                if (err) return res.status(500).json({ error: "Erreur lors de la mise à jour." });
                return res.status(200).json({ message: "Projet mis à jour avec succès." });
            }
        );
    });
});




// Récupérer les projets (par défaut ceux du quartier de l'utilisateur, sauf si ?all=true)
router.get('/', (req, res) => {
    const { user_id, all } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "user_id est requis." });
    }

    con.query("SELECT quartier_id FROM users WHERE id = ?", [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (results.length === 0) return res.status(404).json({ error: "Utilisateur introuvable." });

        const quartierId = results[0].quartier_id;

        let sql = `
            SELECT p.*, u.name AS author_name,
                (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'up') AS up_votes,
                (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'down') AS down_votes
            FROM projects p
            JOIN users u ON p.author_id = u.id
        `;

        // Appliquer le filtre par quartier si "all" n'est pas demandé
        if (!all || all !== "true") {
            sql += ` WHERE p.quartier_id = ${quartierId}`;
        }

        sql += ` ORDER BY p.created_at DESC`;

        con.query(sql, (err, results) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur lors de la récupération des projets." });
            }
            res.json(results);
        });
    });
});




// Détails d'un projet par son ID
router.get('/:id', (req, res) => {
    const projectId = req.params.id;

    const sql = `
        SELECT p.*, u.name AS author_name,
               (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'up') AS up_votes,
               (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'down') AS down_votes
        FROM projects p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
    `;

    con.query(sql, [projectId], (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur lors de la récupération du projet." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Projet introuvable." });
        }

        res.json(results[0]);
    });
});


// Voter sur un projet
router.post('/:id/vote', (req, res) => {
    const { user_id, vote } = req.body;
    const projectId = req.params.id;

    if (!user_id || !vote || !['up', 'down'].includes(vote)) {
        console.log("⚠️ Requête invalide :", req.body);
        return res.status(400).json({ error: "Requête invalide." });
    }

    // Vérifier que l'utilisateur n'est pas le créateur du projet
    con.query("SELECT author_id FROM projects WHERE id = ?", [projectId], (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Projet introuvable." });
        }

        if (results[0].author_id === user_id) {
            return res.status(403).json({ error: "Vous ne pouvez pas voter sur votre propre projet." });
        }

        // Vérifier si l'utilisateur a déjà voté
        con.query("SELECT * FROM project_votes WHERE user_id = ? AND project_id = ?", [user_id, projectId], (err, voteResults) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur serveur." });
            }

            if (voteResults.length > 0) {
                // Si l'utilisateur a déjà voté, supprimer son vote si c'est le même ou le modifier si c'est différent
                if (voteResults[0].vote === vote) {
                    con.query("DELETE FROM project_votes WHERE user_id = ? AND project_id = ?", [user_id, projectId], (err) => {
                        if (err) return res.status(500).json({ error: "Erreur serveur." });
                        return res.status(200).json({ message: "Votre vote a été retiré." });
                    });
                } else {
                    con.query("UPDATE project_votes SET vote = ? WHERE user_id = ? AND project_id = ?", [vote, user_id, projectId], (err) => {
                        if (err) return res.status(500).json({ error: "Erreur serveur." });
                        return res.status(200).json({ message: "Votre vote a été mis à jour." });
                    });
                }
            } else {
                // Ajouter un nouveau vote
                con.query("INSERT INTO project_votes (user_id, project_id, vote) VALUES (?, ?, ?)", [user_id, projectId, vote], (err) => {
                    if (err) return res.status(500).json({ error: "Erreur serveur." });
                    return res.status(201).json({ message: "Vote enregistré avec succès." });
                });
            }
        });
    });
});

module.exports = router;