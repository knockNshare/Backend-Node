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

// Démarrer le serveur
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Serveur en écoute sur http://localhost:${PORT}`);
    });
}

module.exports = app;
