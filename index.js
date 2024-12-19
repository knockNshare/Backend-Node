require('dotenv').config({ path: './.env' });

const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); // This will load the variables from the .env file

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 3000; // Utilisation de la variable d'environnement ou port par défaut

// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies

// Configuration et connexion MySQL avec les variables d'environnement
var con = mysql.createConnection({
    host: process.env.DB_HOST,      // Utilise la variable DB_HOST
    user: process.env.DB_USER,      // Utilise la variable DB_USER
    password: process.env.DB_PASSWORD, // Utilise la variable DB_PASSWORD
    database: process.env.DB_NAME   // Utilise la variable DB_NAME
});

// Connexion à la base de données
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to the database!");
});

// API Endpoints
app.get('/', (req, res) => {
    res.send('Bienvenue clara dans l API !');
});

app.get('/api/hello', (req, res) => {
    const exampleData = { message: 'Helloo beautiful people!' };
    res.json(exampleData);
});
app.get("/get", (req,res) =>{
    res.json({message: "Voici les données"});
});
// Route pour l'inscription
app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;

    console.log('Requête reçue pour inscription :', { name, email, password }); // Log des données reçues

    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    con.query(sql, [name, email, password], (err, result) => {
        if (err) {
            console.error('Erreur SQL :', err); // Log des erreurs SQL
            res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
        } else {
            res.status(201).json({ message: 'Utilisateur créé avec succès' });
        }
    });
});

//Ajout d'une route pour la connexion de l'utilisateur (authentification)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    con.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length > 0) {
            res.status(200).json({ message: 'Connexion réussie', user: results[0] });
        } else {
            res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
    });
});
// Route for creating an event
app.post('/api/events', (req, res) => {
    const { title, description, date, address, category,imageURL,latitude, longitude, creator_id } = req.body;

    const sql = 'INSERT INTO events (title, description, date,category,imageURL, address, latitude, longitude, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?,?,?)';
    con.query(sql, [title, description, date, address, category,imageURL,latitude, longitude, creator_id], (err, result) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
        }
        res.status(201).json({ message: 'Événement créé avec succès', event_id: result.insertId });
    });
});
// Route to get events by user ID (as creator or participant)
app.get('/api/events/user/:user_id', (req, res) => {
    const userId = req.params.user_id;

    // Query to get events where the user is the creator
    const sqlCreator = 'SELECT * FROM events WHERE creator_id = ?';

    // Query to get events where the user is a participant
    const sqlParticipant = 'SELECT e.* FROM events e JOIN participants p ON e.id = p.event_id WHERE p.user_id = ?';

    // Get events where the user is the creator
    con.query(sqlCreator, [userId], (err, creatorEvents) => {
        if (err) {
            console.error('Erreur SQL (creator events):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        // Get events where the user is a participant
        con.query(sqlParticipant, [userId], (err, participantEvents) => {
            if (err) {
                console.error('Erreur SQL (participant events):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // Format the response with two sections: creator events and participant events
            const response = {
                creatorEvents: creatorEvents,  // Events where the user is the creator
                participantEvents: participantEvents  // Events where the user is a participant
            };

            // If no events are found in either section
            if (response.creatorEvents.length === 0 && response.participantEvents.length === 0) {
                return res.status(404).json({ error: 'Aucun événement trouvé pour cet utilisateur' });
            }

            // Send the formatted response
            res.status(200).json(response);
        });
    });
});
//route to get events that are in the same region as the user
app.get('/api/events/region/:user_id', (req, res) => {
    const userId = req.params.user_id;
    const radius = 10; // Define the radius in kilometers (e.g., 10 km)
    console.log(" I entered region");
    // Query to get the user's city (latitude, longitude)
    const sqlUserCity = 'SELECT c.latitude, c.longitude FROM users u JOIN cities c ON u.city_id = c.id WHERE u.id = ?';

    con.query(sqlUserCity, [userId], (err, userCity) => {
        if (err) {
            console.error('Erreur SQL (user city):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (userCity.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const userLat = userCity[0].latitude;
        const userLon = userCity[0].longitude;
        console.log("user localisation is",userLat,userLon);
        // SQL query to find events within the given radius of the user's city
        const sqlEventsInRegion = `
            SELECT e.*, 
                (6371 * acos(cos(radians(?)) * cos(radians(e.latitude)) * cos(radians(e.longitude) - radians(?)) + sin(radians(?)) * sin(radians(e.latitude)))) AS distance
            FROM events e
            HAVING distance <= ?
            ORDER BY distance;
        `;

        // Query to get all events within the radius
        con.query(sqlEventsInRegion, [userLat, userLon, userLat, radius], (err, events) => {
            if (err) {
                console.error('Erreur SQL (events in region):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // If no events are found
            if (events.length === 0) {
                return res.status(404).json({ error: 'Aucun événement trouvé dans cette région' });
            }

            // Send the events as response
            res.status(200).json(events);
        });
    });
});
app.post('/api/events/participate', (req, res) => {
    const { event_id, user_id } = req.body;

    if (!event_id || !user_id) {
        return res.status(400).json({ error: 'Event ID and User ID are required' });
    }

    // Check if the user is already participating
    const checkParticipationSql = 'SELECT * FROM participants WHERE event_id = ? AND user_id = ?';
    
    con.query(checkParticipationSql, [event_id, user_id], (err, results) => {
        if (err) {
            console.error('Erreur SQL (check participation):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'User is already participating in this event' });
        }

        // Add the user to the participants table
        const insertParticipationSql = 'INSERT INTO participants (event_id, user_id, status) VALUES (?, ?, ?)';
        
        con.query(insertParticipationSql, [event_id, user_id, 'participating'], (err, result) => {
            if (err) {
                console.error('Erreur SQL (insert participation):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // Respond with a success message
            res.status(201).json({ message: 'User successfully added to event participants' });
        });
    });
});
app.delete('/api/events/leave', (req, res) => {
    const { event_id, user_id } = req.body;

    if (!event_id || !user_id) {
        return res.status(400).json({ error: 'Event ID and User ID are required' });
    }

    // Check if the user is actually participating
    const checkParticipationSql = 'SELECT * FROM participants WHERE event_id = ? AND user_id = ?';
    
    con.query(checkParticipationSql, [event_id, user_id], (err, results) => {
        if (err) {
            console.error('Erreur SQL (check participation):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User is not participating in this event' });
        }

        // Remove the user from the participants table
        const deleteParticipationSql = 'DELETE FROM participants WHERE event_id = ? AND user_id = ?';
        
        con.query(deleteParticipationSql, [event_id, user_id], (err, result) => {
            if (err) {
                console.error('Erreur SQL (delete participation):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // Respond with a success message
            res.status(200).json({ message: 'User successfully left the event' });
        });
    });
});
// Route to search propositions based on service type, interest status, and position
app.get('/api/propositions/search', (req, res) => {
    const { service_type, user_id } = req.query;

    if (!service_type || !user_id) {
        return res.status(400).json({ error: 'Service type and user_id are required' });
    }

    // Step 1: Get the user's city, latitude, and longitude
    const getUserLocationSQL = `
        SELECT u.city_id, c.latitude AS user_latitude, c.longitude AS user_longitude
        FROM users u
        JOIN cities c ON u.city_id = c.id
        WHERE u.id = ?
    `;

    con.query(getUserLocationSQL, [user_id], (err, userResults) => {
        if (err) {
            console.error('Erreur SQL (get user location):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const userLatitude = userResults[0].user_latitude;
        const userLongitude = userResults[0].user_longitude;

        // Step 2: SQL query to get propositions based on service type and is_active status, including proposer city
        let sql = `
            SELECT p.*, 
                   ( 6371 * acos( cos( radians(?) ) * cos( radians(c.latitude) ) * cos( radians(c.longitude) - radians(?) ) + sin( radians(?) ) * sin( radians(c.latitude) ) ) ) AS distance
            FROM propositions p
            JOIN categories cat ON p.category_id = cat.id
            LEFT JOIN users u ON p.proposer_id = u.id  -- Join with users to get proposer location
            LEFT JOIN cities c ON u.city_id = c.id  -- Join with cities to get the proposer's latitude and longitude
            WHERE cat.service_type = ?
            AND p.is_active = true
        `;

        // Add a condition to limit results to a certain distance (e.g., 50 km)
        const distanceLimit = 50; // Limit distance to 50 km
        sql += ` HAVING distance <= ?`;

        // Step 3: Execute the query
        con.query(sql, [userLatitude, userLongitude, userLatitude, service_type, distanceLimit], (err, results) => {
            if (err) {
                console.error('Erreur SQL (search propositions):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // Step 4: Return results if propositions found, else return error
            if (results.length === 0) {
                return res.status(404).json({ error: 'Aucune proposition trouvée avec les critères spécifiés' });
            }

            // Return the matching propositions
            res.status(200).json(results);
        });
    });
});

// Démarrer le serveur
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Serveur en écoute sur http://localhost:${PORT}`);
    });
}

module.exports = app;
