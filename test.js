// api.test.js
const request = require('supertest');
const app = require('./index'); // Import your Express app

describe('API Tests', () => {
    // Test GET /
    test('GET / - Welcome message', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Welcome to the API!'); // Expect the welcome message
    });

    // Test GET /api/hello
    test('GET /api/hello - Greeting message', async () => {
        const response = await request(app).get('/api/hello');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Helloo beautiful people!' }); // Check the response body
    });
});
