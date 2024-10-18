// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies

// Connect to the database (optional, for MongoDB)
// mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.log('MongoDB connection error:', err));

// API Endpoints
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

app.get('/api/hello', (req, res) => {
    // Example data retrieval logic (e.g., from a database)
    const exampleData = { message: 'Hello, world!' };
    res.json(exampleData);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
