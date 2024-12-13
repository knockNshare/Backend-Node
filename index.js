//fichier principal du backend :  Il configure et démarre le serveur Express. Il inclut les middlewares, les routes, et les fonctionnalités principales.
// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000; // Use environment variable or default to 3000

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

//Ajout d'une route pour la connexion de l'utilisateur (authentification)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Exemple simplifié de validation
    if (email === 'test@example.com' && password === 'password') {
        res.status(200).json({ token: 'fake-jwt-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Export the app for testing
module.exports = app;

// Start the server only if this file is executed directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
