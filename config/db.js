const mysql = require('mysql2');

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

con.connect(err => {
    if (err) {
        console.error('Erreur de connexion MySQL :', err);
        throw err;
    }
    console.log('✅ Connecté à la base de données MySQL');
});

module.exports = con;