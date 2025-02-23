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

    // Test for POST /api/signup
    test('POST /api/signup - Successful user signup', async () => {
        const newUser = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone_number: '1234567890',
            password: 'password123',
            city_id: 75101,
            quartier_id: 57
        };
        const response = await request(app).post('/api/signup').send(newUser);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Utilisateur créé avec succès');
    });

    test('POST /api/signup - Missing required fields', async () => {
        const incompleteUser = {
            name: 'John Doe',
            email: 'john.doe@example.com'
        };
        const response = await request(app).post('/api/signup').send(incompleteUser);
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Tous les champs requis doivent être remplis.');
    });

    // Test for POST /api/login
    test('POST /api/login - Successful login', async () => {
        const loginCredentials = {
            email: 'john.doe@example.com',
            password: 'password123'
        };
        const response = await request(app).post('/api/login').send(loginCredentials);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Connexion réussie');
    });

    test('POST /api/login - Invalid credentials', async () => {
        const invalidCredentials = {
            email: 'john.doe@example.com',
            password: 'wrongpassword'
        };
        const response = await request(app).post('/api/login').send(invalidCredentials);
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Email ou mot de passe incorrect');
    });

    // Test for POST /api/events
    test('POST /api/events - Event creation', async () => {
        const eventData = {
            title: 'Sample Event',
            description: 'This is a test event',
            date: '2025-03-15',
            category: 'Music',
            imageURL: 'http://example.com/event.jpg',
            address: '123 Test Street',
            city_id: 75101,
            creator_id: 1
        };

        const response = await request(app).post('/api/events').send(eventData);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Événement créé avec succès');
    });

    // Test for GET /api/events
    test('GET /api/events - Get all events', async () => {
        const response = await request(app).get('/api/events');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });

    // Test for GET /api/events/user/:user_id
    test('GET /api/events/user/:user_id - Get events by user ID', async () => {
        const response = await request(app).get('/api/events/user/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('creatorEvents');
        expect(response.body).toHaveProperty('participantEvents');
    });

    // Test for GET /api/events/region/:city_id
    test('GET /api/events/region/:city_id - Get events by city ID', async () => {
        const response = await request(app).get('/api/events/region/1');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });
    // Test for GET /api/events/search - Fuzzy search
    test('GET /api/events/search - Search for events with keyword', async () => {
        const response = await request(app).get('/api/events/search?search=Music');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });

 // Test for POST /api/events
    test('POST /api/events - Event creation', async () => {
        const eventData = {
            title: 'Sample Event',
            description: 'This is a test event',
            date: '2025-03-15',
            category: 'Music',
            imageURL: 'http://example.com/event.jpg',
            address: '123 Test Street',
            city_id: 75101,
            creator_id: 1
        };

        const response = await request(app).post('/api/events').send(eventData);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Événement créé avec succès');
    });

    // Test for GET /api/events
    test('GET /api/events - Get all events', async () => {
        const response = await request(app).get('/api/events');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });

    // Test for GET /api/events/user/:user_id
    test('GET /api/events/user/:user_id - Get events by user ID', async () => {
        const response = await request(app).get('/api/events/user/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('creatorEvents');
        expect(response.body).toHaveProperty('participantEvents');
    });

    // Test for PUT /api/events/:id - Update Event
 
    test('PUT /api/events/:id - Event not found or unauthorized', async () => {
        const eventData = {
            title: 'Updated Event',
            description: 'Updated Description',
            date: '2025-03-20',
            category: 'Music',
            imageURL: 'http://example.com/updated_event.jpg',
            address: 'Updated Address',
            creator_id: 1
        };

        const response = await request(app).put('/api/events/999').send(eventData);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Événement introuvable ou non autorisé.');
    });

    // Test for GET /api/events/:id - Get event by ID
    test('GET /api/events/:id - Get event details by ID', async () => {
        const response = await request(app).get('/api/events/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('description');
    });

    test('GET /api/events/:id - Event not found', async () => {
        const response = await request(app).get('/api/events/1');
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Événement introuvable.');
    });

    // Test for DELETE /api/events/:id - Delete Event
    test('DELETE /api/events/:id - Successful event deletion', async () => {
        const response = await request(app).delete('/api/events/1');
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Événement supprimé avec succès.');
    });

    test('DELETE /api/events/:id - Event not found', async () => {
        const response = await request(app).delete('/api/events/1');
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('Événement introuvable.');
    });

    // Test for GET /api/events/region/:city_id - Get events by city ID
    test('GET /api/events/region/:city_id - Get events by city ID', async () => {
        const response = await request(app).get('/api/events/region/1');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });

    // Test for GET /api/events/search - Fuzzy search
    test('GET /api/events/search - Search for events with keyword', async () => {
        const response = await request(app).get('/api/events/search?search=Music');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });


});
