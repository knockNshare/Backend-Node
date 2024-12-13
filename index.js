//fichier principal du backend :  Il configure et démarre le serveur Express. Il inclut les middlewares, les routes, et les fonctionnalités principales.
// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');

const cors = require('cors');


const mysql = require('mysql2');

// Configuration de la base de données
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'hana1234', // mot de passe MySQL si nécessaire
    database: 'projets_devops'
});

// Connection à la base de données
db.connect((err) => {
    if (err) throw err;
    console.log('Connecté à la base de données MySQL');
});

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5001; // Use environment variable or default to 3000

app.use(cors());

// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies

// API Endpoints
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

app.get('/api/hello', (req, res) => {
    const exampleData = { message: 'Helloo beautiful people!' };
    res.json(exampleData);
});

// Route pour l'inscription
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;

    console.log('Requête reçue pour inscription :', { name, email, password }); // Log des données reçues

    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(sql, [name, email, password], (err, result) => {
        if (err) {
            console.error('Erreur SQL :', err); // Log des erreurs SQL
            res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
        } else {
            res.status(201).json({ message: 'Utilisateur créé avec succès' });
        }
    });
});

//Ajout d'une route pour la connexion de l'utilisateur (authentification)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
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
// Export the app for testing
module.exports = app;

// Start the server only if this file is executed directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
