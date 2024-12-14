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
// Démarrer le serveur
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Serveur en écoute sur http://localhost:${PORT}`);
    });
}

module.exports = app;
