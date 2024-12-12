// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database'); // Importer la config de la base

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

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

// Export the app for testing
module.exports = app;

// Start the server only if this file is executed directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Tester la connexion à la base
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connexion à la base de données réussie !');

        const PORT = 3000;
        app.listen(PORT, () => {
            console.log(`Serveur en écoute sur http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erreur de connexion à la base de données :', error);
    }
})();