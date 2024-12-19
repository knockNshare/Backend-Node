require('dotenv').config({ path: './.env' });

const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 3000; // Utilisation de la variable d'environnement ou port par défaut

// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies

// Configuration et connexion MySQL avec les variables d'environnement
var con = mysql.createConnection({
    host: process.env.DB_HOST,      // Utilise la variable DB_HOST
    user: process.env.DB_USER,      // Utilise la variable DB_USER
    password: process.env.DB_PASSWORD, // Utilise la variable DB_PASSWORD
    database: process.env.DB_NAME   // Utilise la variable DB_NAME
});

// Connexion à la base de données
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to the database!");
});

// API Endpoints
app.get('/', (req, res) => {
    res.send('Bienvenue clara dans l API !');
});

app.get('/api/hello', (req, res) => {
    const exampleData = { message: 'Helloo beautiful people!' };
    res.json(exampleData);
});
app.get("/get", (req,res) =>{
    res.json({message: "Voici les données"});
});

// Middleware pour parser le JSON dans la requête
app.use(express.json());

// recupère les users
app.get("/users", (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
        SELECT id, name, email, phone_number, role, city_id, created_at, updated_at
        FROM users
        LIMIT ? OFFSET ?
    `;

    con.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res.status(500).json({
                error: "An error occurred while fetching users."
            });
        }

        res.json({
            message: "Here are the users",
            data: results,
            pagination: {
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            }
        });
    });
});

//Ajouter une proposition
app.post("/propositions", (req, res) => {
    const { category_id, proposer_id, title, description } = req.body;

    if (!category_id || !proposer_id || !title || !description) {
        return res.status(400).json({
            error: "Missing required fields: category_id, proposer_id, title, and description."
        });
    }

    const query = `
        INSERT INTO propositions (category_id, proposer_id, title, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
    `;

    con.query(query, [category_id, proposer_id, title, description], (err, results) => {
        if (err) {
            console.error("Error adding proposition:", err);
            return res.status(500).json({
                error: "An error occurred while adding the proposition."
            });
        }

        res.status(201).json({
            message: "Proposition successfully created",
            data: {
                id: results.insertId,
                category_id,
                proposer_id,
                title,
                description,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        });
    });
});

// Route pour récupérer toutes les propositions
app.get("/propositions", (req, res) => {
    const query = `
        SELECT p.id, p.category_id, p.proposer_id, p.title, p.description, p.is_active, p.created_at, p.updated_at,
               c.service_type AS category_name,
               u.name AS proposer_name, u.email AS proposer_email
        FROM propositions p
                 JOIN categories c ON p.category_id = c.id
                 JOIN users u ON p.proposer_id = u.id
    `;

    con.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching propositions:", err);
            return res.status(500).json({ error: "An error occurred while fetching propositions." });
        }

        res.json({
            message: "Here are the propositions",
            data: results
        });
    });
});

// Route pour modifier une proposition
app.put("/propositions/:id", (req, res) => {
    const propositionId = req.params.id;
    const { category_id, proposer_id, title, description, is_active } = req.body;

    if (!category_id && !proposer_id && !title && !description && is_active === undefined) {
        return res.status(400).json({
            error: "No fields provided to update."
        });
    }

    let fields = [];
    let values = [];
    if (category_id) {
        fields.push("category_id = ?");
        values.push(category_id);
    }
    if (proposer_id) {
        fields.push("proposer_id = ?");
        values.push(proposer_id);
    }
    if (title) {
        fields.push("title = ?");
        values.push(title);
    }
    if (description) {
        fields.push("description = ?");
        values.push(description);
    }
    if (is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(is_active);
    }

    values.push(propositionId);

    const query = `
        UPDATE propositions
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE id = ?
    `;

    con.query(query, values, (err, results) => {
        if (err) {
            console.error("Error updating proposition:", err);
            return res.status(500).json({
                error: "An error occurred while updating the proposition."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Proposition not found."
            });
        }

        res.json({
            message: "Proposition successfully updated",
            updatedFields: { category_id, proposer_id, title, description, is_active }
        });
    });
});

// Route pour supprimer une proposition
app.delete("/propositions/:id", (req, res) => {
    const propositionId = req.params.id;

    if (!propositionId) {
        return res.status(400).json({ error: "Proposition ID is required." });
    }

    const query = `DELETE FROM propositions WHERE id = ?`;

    con.query(query, [propositionId], (err, results) => {
        if (err) {
            console.error("Error deleting proposition:", err);
            return res.status(500).json({
                error: "An error occurred while deleting the proposition."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Proposition not found."
            });
        }

        res.json({
            message: "Proposition successfully deleted."
        });
    });
});

// Récupérer toutes les catégories
app.get("/categories", (req, res) => {
    const query = "SELECT * FROM categories";

    con.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching categories:", err);
            return res.status(500).json({ error: "An error occurred while fetching categories." });
        }

        res.json({
            message: "Here are the categories",
            data: results
        });
    });
});

//Ajouter une catégorie
app.post("/categories", (req, res) => {
    const { service_type } = req.body;

    if (!service_type) {
        return res.status(400).json({
            error: "Missing required field: service_type."
        });
    }

    const query = "INSERT INTO categories (service_type, created_at, updated_at) VALUES (?, NOW(), NOW())";

    con.query(query, [service_type], (err, results) => {
        if (err) {
            console.error("Error adding category:", err);
            return res.status(500).json({
                error: "An error occurred while adding the category."
            });
        }

        res.status(201).json({
            message: "Category successfully created",
            data: {
                id: results.insertId,
                service_type,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        });
    });
});

//Supprimer une catégorie
app.delete("/categories/:id", (req, res) => {
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


//Lister les propositions par catégorie
app.get("/categories/:id/propositions", (req, res) => {
    const categoryId = req.params.id;

    const query = `
        SELECT p.id, p.title, p.description, p.is_active, p.created_at, p.updated_at,
               u.name AS proposer_name, u.email AS proposer_email
        FROM propositions p
                 JOIN users u ON p.proposer_id = u.id
        WHERE p.category_id = ?
    `;

    con.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error("Error fetching propositions for category:", err);
            return res.status(500).json({
                error: "An error occurred while fetching propositions for the category."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "No propositions found for this category."
            });
        }

        res.json({
            message: "Here are the propositions for the category",
            data: results
        });
    });
});

// Récupérer tous les intérêts.
app.get("/interests", (req, res) => {
    const query = `
        SELECT i.id, i.proposition_id, i.interested_user_id, i.start_date, i.end_date, i.status, i.created_at, i.updated_at,
               p.title AS proposition_title, p.description AS proposition_description,
               u.name AS user_name, u.email AS user_email
        FROM interests i
        JOIN propositions p ON i.proposition_id = p.id
        JOIN users u ON i.interested_user_id = u.id
    `;

    con.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching interests:", err);
            return res.status(500).json({
                error: "An error occurred while fetching interests."
            });
        }

        res.json({
            message: "Here are the interests",
            data: results
        });
    });
});

// Récupérer un intérêt spécifique par son ID interests.
app.get("/interests/:id", (req, res) => {
    const interestId = req.params.id;

    const query = `
        SELECT i.id, i.proposition_id, i.interested_user_id, i.start_date, i.end_date, i.status, i.created_at, i.updated_at,
               p.title AS proposition_title, p.description AS proposition_description,
               u.name AS user_name, u.email AS user_email
        FROM interests i
        JOIN propositions p ON i.proposition_id = p.id
        JOIN users u ON i.interested_user_id = u.id
        WHERE i.id = ?
    `;

    con.query(query, [interestId], (err, results) => {
        if (err) {
            console.error("Error fetching interest:", err);
            return res.status(500).json({
                error: "An error occurred while fetching the interest."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Interest not found."
            });
        }

        res.json({
            message: "Here is the interest",
            data: results[0]
        });
    });
});

//Récupérer les intérêts pour un utilisateur spécifique
app.get("/interests/users/:id", (req, res) => {
    const userId = req.params.id;

    const query = `
        SELECT i.id, i.proposition_id, i.interested_user_id, i.start_date, i.end_date, i.status, i.created_at, i.updated_at,
               p.title AS proposition_title, p.description AS proposition_description,
               u.name AS user_name, u.email AS user_email
        FROM interests i
        JOIN propositions p ON i.proposition_id = p.id
        JOIN users u ON i.interested_user_id = u.id
        WHERE i.interested_user_id = ?
    `;

    con.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching interests for user:", err);
            return res.status(500).json({
                error: "An error occurred while fetching the interests for the user."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "No interests found for the user."
            });
        }

        res.json({
            message: "Here are the interests for the user",
            data: results
        });
    });
});


// ajouter un nouvel intérêt.
app.post("/interests", (req, res) => {
    const { proposition_id, interested_user_id, start_date, end_date } = req.body;

    // Vérification des champs requis
    if (!proposition_id || !interested_user_id || !start_date) {
        return res.status(400).json({
            error: "Missing required fields: proposition_id, interested_user_id, and start_date are required."
        });
    }

    // Vérifie que les clés étrangères existent
    const checkQuery = `
        SELECT
                (SELECT COUNT(*) FROM propositions WHERE id = ?) AS proposition_exists,
                (SELECT COUNT(*) FROM users WHERE id = ?) AS user_exists
    `;

    con.query(checkQuery, [proposition_id, interested_user_id], (err, results) => {
        if (err) {
            console.error("Error checking foreign keys:", err);
            return res.status(500).json({
                error: "An error occurred while validating foreign keys."
            });
        }

        const { proposition_exists, user_exists } = results[0];

        // Vérifie si les clés étrangères existent
        if (!proposition_exists || !user_exists) {
            return res.status(400).json({
                error: "Invalid foreign keys: proposition_id or interested_user_id does not exist."
            });
        }

        // Si tout est valide, insère l'intérêt
        const query = `
            INSERT INTO interests (proposition_id, interested_user_id, start_date, end_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
        `;

        con.query(query, [proposition_id, interested_user_id, start_date, end_date || null], (err, results) => {
            if (err) {
                console.error("SQL Error:", err);
                return res.status(500).json({
                    error: "An error occurred while adding the interest."
                });
            }

            res.status(201).json({
                message: "Interest successfully created",
                data: {
                    id: results.insertId,
                    proposition_id,
                    interested_user_id,
                    start_date,
                    end_date,
                    status: "pending",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            });
        });
    });
});

// modifier un intérêt existant par son ID.
app.put("/interests/:id", (req, res) => {
    const interestId = req.params.id;
    const { start_date, end_date, status } = req.body;

    if (!start_date && !end_date && !status) {
        return res.status(400).json({
            error: "No fields provided to update."
        });
    }

    let fields = [];
    let values = [];
    if (start_date) {
        fields.push("start_date = ?");
        values.push(start_date);
    }
    if (end_date) {
        fields.push("end_date = ?");
        values.push(end_date);
    }
    if (status) {
        fields.push("status = ?");
        values.push(status);
    }

    values.push(interestId);

    const query = `
        UPDATE interests
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE id = ?
    `;

    con.query(query, values, (err, results) => {
        if (err) {
            console.error("Error updating interest:", err);
            return res.status(500).json({
                error: "An error occurred while updating the interest."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Interest not found."
            });
        }

        res.json({
            message: "Interest successfully updated",
            updatedFields: { start_date, end_date, status }
        });
    });
});

// Modifier un intérêt d'un utilisateur
app.put("/interests/users/:id", (req, res) => {
    const userId = req.params.id; // ID de l'utilisateur
    const { start_date, end_date, status } = req.body;

    // Vérifie qu'au moins un champ est fourni pour la mise à jour
    if (!start_date && !end_date && !status) {
        return res.status(400).json({
            error: "No fields provided to update."
        });
    }

    let fields = [];
    let values = [];
    if (start_date) {
        fields.push("start_date = ?");
        values.push(start_date);
    }
    if (end_date) {
        fields.push("end_date = ?");
        values.push(end_date);
    }
    if (status) {
        fields.push("status = ?");
        values.push(status);
    }

    values.push(userId); // Ajoute l'ID de l'utilisateur comme dernier paramètre

    // Requête SQL pour mettre à jour les intérêts de l'utilisateur
    const query = `
        UPDATE interests
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE interested_user_id = ?
    `;

    con.query(query, values, (err, results) => {
        if (err) {
            console.error("Error updating interests for user:", err);
            return res.status(500).json({
                error: "An error occurred while updating the interests for the user."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "No interests found for this user."
            });
        }

        res.json({
            message: "Interests successfully updated for the user",
            updatedFields: { start_date, end_date, status }
        });
    });
});


//supprimer un intérêt par son ID.
app.delete("/interests/:id", (req, res) => {
    const interestId = req.params.id;

    if (!interestId) {
        return res.status(400).json({ error: "Interest ID is required." });
    }

    const query = `DELETE FROM interests WHERE id = ?`;

    con.query(query, [interestId], (err, results) => {
        if (err) {
            console.error("Error deleting interest:", err);
            return res.status(500).json({
                error: "An error occurred while deleting the interest."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Interest not found."
            });
        }

        res.json({
            message: "Interest successfully deleted"
        });
    });
});

// Supprimer un intérêt d'un utilisateur
app.delete("/interests/users/:id", (req, res) => {
    const userId = req.params.id; // ID de l'utilisateur

    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    // Requête SQL pour supprimer tous les intérêts de l'utilisateur
    const query = `DELETE FROM interests WHERE interested_user_id = ?`;

    con.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error deleting interests for user:", err);
            return res.status(500).json({
                error: "An error occurred while deleting the interests for the user."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "No interests found for this user."
            });
        }

        res.json({
            message: "Interests successfully deleted for the user",
            deletedCount: results.affectedRows
        });
    });
});











app.get("/categories", (req, res) => {
    const query = "SELECT * FROM categories";

    con.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching categories:", err);
            return res.status(500).json({ error: "An error occurred while fetching categories." });
        }

        res.json({
            message: "Here are the categories",
            data: results
        });
    });
});















// Route pour l'inscription
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;

    console.log('Requête reçue pour inscription :', { name, email }); // Log des données reçues (sans le mot de passe)

    // Validation des données
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Tous les champs sont requis : name, email, password' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si l'utilisateur existe déjà
    const checkUserQuery = 'SELECT id FROM users WHERE email = ?';
    con.query(checkUserQuery, [email], (err, results) => {
        if (err) {
            console.error('Erreur SQL lors de la vérification de l\'email :', err);
            return res.status(500).json({ error: 'Erreur serveur lors de la vérification de l\'email' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
        }

        // Insérer le nouvel utilisateur
        const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        con.query(insertUserQuery, [name, email, password], (err, result) => {
            if (err) {
                console.error('Erreur SQL lors de l\'insertion de l\'utilisateur :', err);
                return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
            }

            res.status(201).json({ message: 'Utilisateur créé avec succès' });
        });
    });
});

//Ajout d'une route pour la connexion de l'utilisateur (authentification)
app.post('/api/login', (req, res) => {
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
// Démarrer le serveur
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Serveur en écoute sur http://localhost:${PORT}`);
    });
}

module.exports = app;
