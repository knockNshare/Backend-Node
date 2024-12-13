//Ce fichier est un fichier de test. Il est utilisé pour vérifier que l'application backend fonctionne comme prévu. Il utilise la bibliothèque jest pour définir des tests, et supertest pour simuler des requêtes HTTP vers ton serveur.

const request = require('supertest');
const app = require('./index'); // Import your Express app
let server; // To store the server instance

describe('API Tests', () => {
    // Start the server before tests
    beforeAll((done) => {
        server = app.listen(5000, done); // Start the server
    });

    // Stop the server after tests
    afterAll((done) => {
        server.close(done); // Close the server
    });

    // Test for GET /
    test('GET / - Welcome message', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Welcome to the API!');
    });

    // Test for GET /api/hello
    test('GET /api/hello - Greeting message', async () => {
        const response = await request(app).get('/api/hello');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Helloo beautiful people!' });
    });

    //Test for POST /api/login
    test('POST /api/login - Successful login', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token', 'fake-jwt-token');
    });
    
    test('POST /api/login - Invalid login', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ email: 'wrong@example.com', password: 'wrongpassword' });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
});
