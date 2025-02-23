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
    // Test for GET /api/quartiers/:city_id
    test('GET /api/quartiers/:city_id - Get quartiers by city ID', async () => {
        const response = await request(app).get('/api/quartiers/1');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });

    // Test for GET /cities
    test('GET /cities - Get all cities', async () => {
        const response = await request(app).get('/cities');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });

    // Test for POST /api/events/participate
    test('POST /api/events/participate - User participates in event', async () => {
        const participationData = {
            event_id: 2,
            user_id: 1
        };
        const response = await request(app).post('/api/events/participate').send(participationData);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('User successfully added to event participants');
    });

    test('POST /api/events/participate - Missing event ID or user ID', async () => {
        const invalidData = { event_id: 1 };
        const response = await request(app).post('/api/events/participate').send(invalidData);
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Event ID and User ID are required');
    });

    // Test for DELETE /api/events/leave
    test('DELETE /api/events/leave - User leaves event', async () => {
        const leaveData = {
            event_id: 2,
            user_id: 1
        };
        const response = await request(app).delete('/api/events/leave').send(leaveData);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('User successfully left the event');
    });

    test('DELETE /api/events/leave - User not participating in event', async () => {
        const invalidLeaveData = {
            event_id: 4,
            user_id: 999
        };
        const response = await request(app).delete('/api/events/leave').send(invalidLeaveData);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe('User is not participating in this event');
    });

    // Test for POST /api/projects
    test('POST /api/projects - Successful project creation', async () => {
        const projectData = {
            title: 'Test Project',
            description: 'This is a test project',
            category: 'Technology',
            author_id: 1,
            deadline: '2025-05-01'
        };
        const response = await request(app).post('/api/projects').send(projectData);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Projet créé avec succès');
    });

    test('POST /api/projects - Missing required fields', async () => {
        const incompleteProjectData = {
            title: 'Test Project',
            description: 'This is a test project'
        };
        const response = await request(app).post('/api/projects').send(incompleteProjectData);
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Tous les champs sont obligatoires.');
    });

    // Test for DELETE /api/projects/:id
    test('DELETE /api/projects/:id - Delete project as author', async () => {
        const projectData = {
            user_id: 1
        };
        const response = await request(app).delete('/api/projects/1').send(projectData);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Projet supprimé avec succès.');
    });

    test('DELETE /api/projects/:id - Unauthorized to delete project', async () => {
        const projectData = {
            user_id: 999
        };
        const response = await request(app).delete('/api/projects/1').send(projectData);
        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Vous n\'êtes pas autorisé à supprimer ce projet.');
    });

    // Test for PUT /api/projects/:id
    test('PUT /api/projects/:id - Update project details', async () => {
        const projectData = {
            title: 'Updated Project',
            description: 'Updated description',
            category: 'Science',
            deadline: '2025-06-01',
            user_id: 1
        };
        const response = await request(app).put('/api/projects/1').send(projectData);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Projet mis à jour avec succès.');
    });

    test('PUT /api/projects/:id - Unauthorized to update project', async () => {
        const projectData = {
            title: 'Updated Project',
            description: 'Updated description',
            category: 'Science',
            deadline: '2025-06-01',
            user_id: 999
        };
        const response = await request(app).put('/api/projects/1').send(projectData);
        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Accès interdit. Ce projet ne vous appartient pas.');
    });

    // Test for GET /api/projects
    test('GET /api/projects - Get projects by user ID', async () => {
        const response = await request(app).get('/api/projects?user_id=1');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); // Check if the response is an array
    });

    // Test for GET /api/projects/:id
    test('GET /api/projects/:id - Get project details by ID', async () => {
        const response = await request(app).get('/api/projects/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(1);
    });

    // Test for POST /api/projects/:id/vote
    test('POST /api/projects/:id/vote - Vote on project', async () => {
        const voteData = {
            user_id: 1,
            vote: 'up'
        };
        const response = await request(app).post('/api/projects/1/vote').send(voteData);
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Vote enregistré avec succès.');
    });

    test('POST /api/projects/:id/vote - Invalid vote', async () => {
        const invalidVoteData = {
            user_id: 1,
            vote: 'invalid'
        };
        const response = await request(app).post('/api/projects/1/vote').send(invalidVoteData);
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Requête invalide.');
    });

});
