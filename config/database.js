require('dotenv').config({ path: '../.env' });


var mysql = require('mysql');

// Utilisation des variables d'environnement définies dans le fichier .env
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
