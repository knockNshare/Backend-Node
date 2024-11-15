// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');

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
