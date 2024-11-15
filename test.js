const request = require('supertest');
const app = require('./index'); // Import your Express app
let server; // To store the server instance

describe('API Tests', () => {
    // Start the server before tests
    beforeAll((done) => {
        server = app.listen(3000, done); // Start the server
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
});
