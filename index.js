require('dotenv').config({ path: './.env' }); 
const cors = require('cors');
const mysql = require('mysql2'); 
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const http = require("http");
const socketIo = require("socket.io");
const Fuse = require('fuse.js');

// Initialiser l'application Express
const app = express();

// Configuration socket.io pour les notifications en temps réel
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

app.use(cors()); 
app.use(express.json());

app.set("socketio", io); 

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId|| userId === "undefined") {
        console.warn("⚠️ Connexion WebSocket rejetée : userId est vide !");
        socket.disconnect();
        return;
    }

    console.log(`🟢 Connexion WebSocket - Utilisateur ${userId} (Socket ID: ${socket.id})`);

    // Associer userId à un canal spécifique
    socket.join(`user_${userId}`);

    socket.on("disconnect", () => {
        console.log(`🔴 Déconnexion - Utilisateur ${userId} (Socket ID: ${socket.id})`);
    });
});

// Lancement du serveur WebSocket
server.listen(5001, () => {
    console.log("✅ Serveur WebSocket démarré sur le port 5001");
});

// Lancer l'API principale sur le port 3000
const PORT = process.env.PORT || 3000;



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

//-----------API Endpoints pour le TEST-----------
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
    const { name, email, phone_number, password, city_id,quartier_id } = req.body;

    if (!name || !email || !phone_number || !password || !city_id || !quartier_id)  {
        return res.status(400).json({ error: 'Tous les champs requis doivent être remplis.' });
    }

    // Vérifier si l'email existe déjà
    const checkEmailQuery = 'SELECT email FROM users WHERE email = ?';
    con.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error('Erreur SQL lors de la vérification de l\'email :', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        if (results.length > 0) {
            return res.status(409).json({ error: 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.' });
        }

        // Insérer le nouvel utilisateur (sans hashage)
        const insertUserQuery = 'INSERT INTO users (name, email, phone_number, password, city_id,quartier_id) VALUES (?, ?, ?, ?, ?,?)';
        con.query(insertUserQuery, [name, email, phone_number, password, city_id,quartier_id], (err, result) => {
            if (err) {
                console.error('Erreur SQL lors de l\'insertion de l\'utilisateur :', err);
                return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
            }

            res.status(201).json({ message: 'Utilisateur créé avec succès' });
        });
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

// Pour valider une image à partir de son URL
app.get('/api/validate-image', async (req, res) => {
    const { url } = req.query;

    try {
        const response = await fetch(url, { method: 'HEAD' }); // Vérifie l'image
        if (!response.ok) throw new Error('Invalid image');
        res.status(200).json({ valid: true });
    } catch (error) {
        res.status(400).json({ valid: false, error: 'Invalid image URL' });
    }
});


// Route for creating an event
app.post('/api/events', (req, res) => {
    const { title, description, date, category, imageURL, address, city_id, creator_id } = req.body;

    const sql = 'INSERT INTO events (title, description, date, category, imageURL, address, city_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?,?)';
    con.query(sql, [title, description, date, category, imageURL, address, city_id, creator_id], (err, result) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
        }
        res.status(201).json({ message: 'Événement créé avec succès', event_id: result.insertId });
    });
});

app.get('events/search', (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.status(400).json({ error: "Veuillez fournir un terme de recherche." });
    }

    const sql = `
        SELECT *,
            LEVENSHTEIN(LOWER(title), LOWER(?)) AS distance_title,
            LEVENSHTEIN(LOWER(description), LOWER(?)) AS distance_description
        FROM events
        WHERE 
            LEVENSHTEIN(LOWER(title), LOWER(?)) <= 3 
            OR LEVENSHTEIN(LOWER(description), LOWER(?)) <= 3
        ORDER BY distance_title ASC, distance_description ASC
    `;

    con.query(sql, [search, search, search, search], (err, results) => {
        if (err) {
            console.error("Erreur SQL lors de la recherche d'événements :", err);
            return res.status(500).json({ error: "Erreur lors de la recherche d'événements." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Aucun événement trouvé correspondant au terme de recherche." });
        }

        res.status(200).json(results);
    });
});

// Route to get all events
app.get('/api/events', (req, res) => {
    const sql = 'SELECT * FROM events';

    con.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des événements.' });
        }
        res.json(results);
    });
});

app.get('/api/events/search', (req, res) => {
    const { keyword, categories, cityId } = req.query;
    // Step 1: Start with the base query to fetch events
    let sql = 'SELECT * FROM events WHERE 1=1';  // 1=1 is used to easily append additional conditions

    // Step 2: Add filter for keyword (title and description) using Fuse.js if provided
    let filterConditions = [];



    // Step 3: Add filter for categories if provided
    if (categories && categories.trim() !== "") {
        const categoriesArray = categories.split(',');  // Categories come in as a comma-separated string
        filterConditions.push(`category IN (${categoriesArray.map(c => `'${c}'`).join(',')})`);
    }

    // Step 4: Add filter for cityId if provided
    if (cityId && cityId.trim() !== "") {
        filterConditions.push(`city_id = ${cityId}`);
    }

    // Step 5: Combine all filter conditions
    if (filterConditions.length > 0) {
        sql += ' AND ' + filterConditions.join(' AND ');
    }

    // Step 6: Query the database with the constructed SQL query
    con.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur SQL (fetch events):', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }

        // Step 7: If keyword is provided, use Fuse.js for fuzzy searching in title and description
        if (keyword && keyword.trim() !== "") {
            const fuseOptions = {
                keys: ['title', 'description'],
                threshold: 0.4,  // Lower threshold to make the fuzzy search more flexible (default is 0.4)
                distance: 100,   // Increase the distance for matching (allows partial matches)
                includeScore: true,
                minMatchCharLength: 2,  // To avoid very short matches like a single character
                
            };

            const fuse = new Fuse(results, fuseOptions);
            const fuzzyResults = fuse.search(keyword);
            const matchedEvents = fuzzyResults.map(result => result.item);
            console.log("🟢 Fuzzy matched events:", matchedEvents);
            return res.status(200).json(matchedEvents);
        }

        console.log("🟢 Filtered events IDs found:", results.map(event => event.id));
        res.status(200).json(results);
    });
});


// Route pour modifier un événement
app.put('/api/events/:id', (req, res) => {
    const eventId = req.params.id;
    const { title, description, date, category, imageURL, address, creator_id } = req.body;

    // Mise à jour d’un événement par son ID
    const sql = `
        UPDATE events 
        SET title = ?, description = ?, date = ?, category = ?, imageURL = ?, address = ?
        WHERE id = ? AND creator_id = ?
    `;
    con.query(sql, [title, description, date, category, imageURL, address, eventId, creator_id], (err, result) => {
        if (err) {
            console.error('Erreur SQL (modification):', err);
            return res.status(500).json({ error: 'Erreur lors de la modification de l\'événement.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Événement introuvable ou non autorisé.' });
        }

        res.status(200).json({ message: 'Événement modifié avec succès.' });
    });
});


// Route pour récupérer les détails d'un événement par son ID
app.get('/api/events/:id', (req, res) => {
    const eventId = req.params.id;

    const sql = 'SELECT * FROM events WHERE id = ?';
    con.query(sql, [eventId], (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération de l\'événement.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Événement introuvable.' });
        }

        res.status(200).json(results[0]); // Retourne les détails de l'événement
    });
});


// Route pour supprimer un événement
app.delete('/api/events/:id', (req, res) => {
    const eventId = req.params.id;

    // Supprimer un événement par son ID
    const sql = 'DELETE FROM events WHERE id = ?';
    con.query(sql, [eventId], (err, result) => {
        if (err) {
            console.error('Erreur SQL (suppression):', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Événement introuvable.' });
        }

        res.status(200).json({ message: 'Événement supprimé avec succès.' });
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

const getEventsByCity = async (city_id) => {
    // SQL query to retrieve events by city_id
    const query = `
        SELECT *
        FROM events
        WHERE city_id = ?;  
    `;

    try {
        // Run the query with the promise-based API
        const [rows] = await con.promise().query(query, [city_id]);  // Use promise().query() and pass city_id
        return rows;  // `rows` is the result of the query
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error; // Propagate the error
    }
};
const getQuartiersByCity = async (city_id) => {
    // SQL query to retrieve events by city_id
    const query = `
        SELECT *
        FROM quartiers
        WHERE city_id = ?;  
    `;

    try {
        // Run the query with the promise-based API
        const [rows] = await con.promise().query(query, [city_id]);  // Use promise().query() and pass city_id
        return rows;  // `rows` is the result of the query
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error; // Propagate the error
    }
};

app.get('/api/events/city/:city_id', async (req, res) => {
    console.log("I get events by city");

    // Access city_id from the route parameters
    const { city_id } = req.params;  // Access city_id via req.params

    try {
        // Fetch events by city_id from the database
        const events = await getEventsByCity(city_id);
        res.json(events);  // Send the result as JSON
    } catch (error) {
        console.error('Error fetching events by city:', error);
        res.status(500).send("Internal Server Error");  // Handle any errors
    }
});
app.get('/api/quartiers/:city_id', async (req, res) => {
    console.log("I get quartiers by city");

    // Access city_id from the route parameters
    const { city_id } = req.params;  // Access city_id via req.params

    try {
        // Fetch events by city_id from the database
        const events = await getQuartiersByCity(city_id);
        res.json(events);  // Send the result as JSON
    } catch (error) {
        console.error('Error fetching events by city:', error);
        res.status(500).send("Internal Server Error");  // Handle any errors
    }
});

const getcities = async () => {
    // SQL query to retrieve the cities
    const query = `
        SELECT *
        FROM cities;
    `;

    try {
        // Run the query with the promise-based API
        const [rows] = await con.promise().query(query);  // Use promise().query() here
        return rows;  // `rows` is the result of the query
    } catch (error) {
        console.error('Error fetching cities:', error);
        throw error; // Propagate the error
    }
};
app.get('/cities', async (req, res) => {
    console.log("I entered cities");

    try {
        // Fetch cities from the database
        const cities = await getcities();
        res.json(cities);  // Send the result as JSON
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).send("Internal Server Error");  // Handle any errors
    }
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

//--------------------FIN_EVENTS---------------------

//--------------------PROJECTS-------------------------


// Créer un projet
app.post('/api/projects', (req, res) => {
    const { title, description, category, author_id, deadline } = req.body;

    if (!title || !description || !category || !author_id || !deadline) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }

    const sql = `
        INSERT INTO projects (title, description, category, author_id, deadline)
        VALUES (?, ?, ?, ?, ?)
    `;

    con.query(sql, [title, description, category, author_id, deadline], (err, result) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur serveur lors de la création du projet." });
        }
        res.status(201).json({ message: "Projet créé avec succès", project_id: result.insertId });
    });
});



// Supprimer un projet (seulement si l'utilisateur est l'auteur)
app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const { user_id } = req.body;

    // Vérifier si l'utilisateur est bien l'auteur du projet
    con.query("SELECT author_id FROM projects WHERE id = ?", [projectId], (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Projet introuvable." });
        }

        if (results[0].author_id !== user_id) {
            return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer ce projet." });
        }

        // Suppression du projet
        con.query("DELETE FROM projects WHERE id = ?", [projectId], (err) => {
            if (err) return res.status(500).json({ error: "Erreur lors de la suppression du projet." });
            return res.status(200).json({ message: "Projet supprimé avec succès." });
        });
    });
});



// Modifier un projet (seulement si l'utilisateur est l'auteur)
app.put('/api/projects/:id', (req, res) => {

    const projectId = req.params.id;
    const { title, description, category, deadline, user_id } = req.body;
    
    con.query("SELECT author_id FROM projects WHERE id = ?", [projectId], (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        if (results.length === 0) return res.status(404).json({ error: "Projet introuvable." });

        if (Number(results[0].author_id) !== Number(user_id)) {
            return res.status(403).json({ error: "Accès interdit. Ce projet ne vous appartient pas." });
        }

        con.query(
            "UPDATE projects SET title = ?, description = ?, category = ?, deadline = ? WHERE id = ?",
            [title, description, category, deadline, projectId],
            (err) => {
                if (err) return res.status(500).json({ error: "Erreur lors de la mise à jour." });
                return res.status(200).json({ message: "Projet mis à jour avec succès." });
            }
        );
    });
});




// Récupérer tous les projets
app.get('/api/projects', (req, res) => {
    const sql = `
        SELECT p.*, u.name AS author_name,
               (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'up') AS up_votes,
               (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'down') AS down_votes
        FROM projects p
        JOIN users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
    `;

    con.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur lors de la récupération des projets." });
        }
        res.json(results);
    });
});



// Détails d'un projet par son ID
app.get('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;

    const sql = `
        SELECT p.*, u.name AS author_name,
               (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'up') AS up_votes,
               (SELECT COUNT(*) FROM project_votes WHERE project_id = p.id AND vote = 'down') AS down_votes
        FROM projects p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
    `;

    con.query(sql, [projectId], (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur lors de la récupération du projet." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Projet introuvable." });
        }

        res.json(results[0]);
    });
});


// Voter sur un projet
app.post('/api/projects/:id/vote', (req, res) => {
    const { user_id, vote } = req.body;
    const projectId = req.params.id;

    if (!user_id || !vote || !['up', 'down'].includes(vote)) {
        console.log("⚠️ Requête invalide :", req.body);
        return res.status(400).json({ error: "Requête invalide." });
    }

    // Vérifier que l'utilisateur n'est pas le créateur du projet
    con.query("SELECT author_id FROM projects WHERE id = ?", [projectId], (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Projet introuvable." });
        }

        if (results[0].author_id === user_id) {
            return res.status(403).json({ error: "Vous ne pouvez pas voter sur votre propre projet." });
        }

        // Vérifier si l'utilisateur a déjà voté
        con.query("SELECT * FROM project_votes WHERE user_id = ? AND project_id = ?", [user_id, projectId], (err, voteResults) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur serveur." });
            }

            if (voteResults.length > 0) {
                // Si l'utilisateur a déjà voté, supprimer son vote si c'est le même ou le modifier si c'est différent
                if (voteResults[0].vote === vote) {
                    con.query("DELETE FROM project_votes WHERE user_id = ? AND project_id = ?", [user_id, projectId], (err) => {
                        if (err) return res.status(500).json({ error: "Erreur serveur." });
                        return res.status(200).json({ message: "Votre vote a été retiré." });
                    });
                } else {
                    con.query("UPDATE project_votes SET vote = ? WHERE user_id = ? AND project_id = ?", [vote, user_id, projectId], (err) => {
                        if (err) return res.status(500).json({ error: "Erreur serveur." });
                        return res.status(200).json({ message: "Votre vote a été mis à jour." });
                    });
                }
            } else {
                // Ajouter un nouveau vote
                con.query("INSERT INTO project_votes (user_id, project_id, vote) VALUES (?, ?, ?)", [user_id, projectId, vote], (err) => {
                    if (err) return res.status(500).json({ error: "Erreur serveur." });
                    return res.status(201).json({ message: "Vote enregistré avec succès." });
                });
            }
        });
    });
});

//--------------------FIN_PROJECTS---------------------









//--------------------CATEGORIES---------------------

app.get('/api/categories', (req, res) => {
    const sql = 'SELECT id, service_type FROM categories';

    con.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur SQL :', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        res.json(results);
    });
});

app.delete("/categories/:id", (req, res) => {
    const categoryId = req.params.id;

    if (!categoryId) {
        return res.status(400).json({ error: "Category ID is required." });
    }

    const query = `DELETE FROM categories WHERE id = ?`;

    con.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error("Error deleting category:", err);
            return res.status(500).json({
                error: "An error occurred while deleting the category."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Category not found."
            });
        }

        res.json({
            message: "Category successfully deleted."
        });
    });
});

//--------------------PROPOSITIONS---------------------

app.get('/api/propositions/search', (req, res) => {
    const { service_type, user_id, keyword } = req.query;

    if (!user_id) {
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

        // Step 2: SQL query to get propositions based on service type, is_active status, and location
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

        // Step 3: Initialize query parameters
        const queryParams = [userLatitude, userLongitude, userLatitude, service_type];

        // Step 4: Fetch all propositions
        con.query(sql, queryParams, (err, results) => {
            if (err) {
                console.error('Erreur SQL (search propositions):', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            // Step 5: Use Fuse.js for fuzzy searching on 'title' and 'description' if keyword is provided
            if (keyword && keyword.trim() !== "") {
                console.log("keywords are ", keyword);

                // Define Fuse.js options for searching title and description fields
                const fuseOptions = {
                    keys: ['title', 'description'],  // The fields to search
                    threshold: 0.4,  // Fuzzy search threshold (lower is more strict)
                    includeScore: true,
                    distance: 100,   // Increase the distance for matching (allows partial matches)
                    minMatchCharLength: 2,  // To avoid very short matches like a single character
                };

                // Initialize Fuse.js with the fetched results
                const fuse = new Fuse(results, fuseOptions);

                // Perform the fuzzy search using the keyword
                const fuzzyResults = fuse.search(keyword);

                // Extract the matching results
                const matchedPropositions = fuzzyResults.map(result => result.item);

                console.log("🟢 Fuzzy matched results: ", matchedPropositions);

                // Return the matched propositions
                return res.status(200).json(matchedPropositions);
            }

            // If no keyword, return all results with location filtering
            console.log("🟢 Résultats trouvés :", results);
            res.status(200).json(results);
        });
    });
});
//Ajouter une proposition
app.post("/propositions", (req, res) => {
    const { category_id, proposer_id, title, description } = req.body;

    if (!category_id || !proposer_id || !title || !description) {
        return res.status(400).json({
            error: "Missing required fields: category_id, proposer_id, title, and description."
        });
    }

    const query = `
        INSERT INTO propositions (category_id, proposer_id, title, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`
    ;

    con.query(query, [category_id, proposer_id, title, description], (err, results) => {
        if (err) {
            console.error("Error adding proposition:", err);
            return res.status(500).json({
                error: "An error occurred while adding the proposition."
            });
        }

        res.status(201).json({
            message: "Proposition successfully created",
            data: {
                id: results.insertId,
                category_id,
                proposer_id,
                title,
                description,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        });
    });
});

app.put("/propositions/:id", (req, res) => {
    const propositionId = req.params.id;
    const { category_id, proposer_id, title, description, is_active } = req.body;

    if (!category_id && !proposer_id && !title && !description && is_active === undefined) {
        return res.status(400).json({
            error: "No fields provided to update."
        });
    }

    let fields = [];
    let values = [];
    if (category_id) {
        fields.push("category_id = ?");
        values.push(category_id);
    }
    if (proposer_id) {
        fields.push("proposer_id = ?");
        values.push(proposer_id);
    }
    if (title) {
        fields.push("title = ?");
        values.push(title);
    }
    if (description) {
        fields.push("description = ?");
        values.push(description);
    }
    if (is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(is_active);
    }

    values.push(propositionId);

    const query = `
        UPDATE propositions
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE id = ?
    `;

    con.query(query, values, (err, results) => {
        if (err) {
            console.error("Error updating proposition:", err);
            return res.status(500).json({
                error: "An error occurred while updating the proposition."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Proposition not found."
            });
        }

        res.json({
            message: "Proposition successfully updated",
            updatedFields: { category_id, proposer_id, title, description, is_active }
        });
    });
});

app.delete("/propositions/:id", (req, res) => {
    const propositionId = req.params.id;

    if (!propositionId) {
        return res.status(400).json({ error: "Proposition ID is required." });
    }

    const query = `DELETE FROM propositions WHERE id = ?`;

    con.query(query, [propositionId], (err, results) => {
        if (err) {
            console.error("Error deleting proposition:", err);
            return res.status(500).json({
                error: "An error occurred while deleting the proposition."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "Proposition not found."
            });
        }

        res.json({
            message: "Proposition successfully deleted."
        });
    });
});

// Route pour récupérer les propositions d'un utilisateur spécifique
app.get("/propositions/users/:id", (req, res) => {
    const userId = req.params.id; // ID de l'utilisateur connecté

    const query = `
        SELECT p.id, p.category_id, p.proposer_id, p.title, p.description, p.is_active, p.created_at, p.updated_at,
               c.service_type AS category_name
        FROM propositions p
        JOIN categories c ON p.category_id = c.id
        WHERE p.proposer_id = ?
    `;

    con.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching propositions:", err);
            return res.status(500).json({ error: "An error occurred while fetching user propositions." });
        }

        if (results.length === 0) {
            return res.json([]); // 🔥 Retourne une liste vide au lieu d'une erreur 404
        }

        res.json({
            message: "Here are the propositions for the user",
            data: results
        });
    });
});

app.get("/propositions", (req, res) => {
    const query = `
        SELECT p.id, p.category_id, p.proposer_id, p.title, p.description, p.is_active, p.created_at, p.updated_at,
               c.service_type AS category_name,
               u.name AS proposer_name, u.email AS proposer_email
        FROM propositions p
                 JOIN categories c ON p.category_id = c.id
                 JOIN users u ON p.proposer_id = u.id
    `;

    con.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching propositions:", err);
            return res.status(500).json({ error: "An error occurred while fetching propositions." });
        }

        res.json({
            message: "Here are the propositions",
            data: results
        });
    });
});

app.get("/categories/:id/propositions", (req, res) => {
    const categoryId = req.params.id;

    const query = `
        SELECT p.id, p.title, p.description, p.is_active, p.created_at, p.updated_at,
               u.name AS proposer_name, u.email AS proposer_email
        FROM propositions p
                 JOIN users u ON p.proposer_id = u.id
        WHERE p.category_id = ?
    `;

    con.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error("Error fetching propositions for category:", err);
            return res.status(500).json({
                error: "An error occurred while fetching propositions for the category."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "No propositions found for this category."
            });
        }

        res.json({
            message: "Here are the propositions for the category",
            data: results
        });
    });
});


const getPropositionsBySearch = async (keyword) => {
    const query = `
        SELECT *
        FROM propositions
        WHERE title LIKE ? OR description LIKE ?;
    `;
    try {
        const [rows] = await con.promise().query(query, [`%${keyword}%`, `%${keyword}%`]);
        return rows;
    } catch (error) {
        console.error('Error fetching propositions:', error);
        throw error;
    }
};
// Define route to search for propositions by title or description
app.get('/api/propositions/searchText', async (req, res) => {
    const keyword = req.query.keyword;  // Get search term from query parameter
    console.log("I entered searchby text :",keyword);

    if (!keyword) {
        return res.status(400).send("Search term is required");  // If no search term, return an error
    }

    try {
        const propositions = await getPropositionsBySearch(keyword);  // Fetch propositions from DB
        res.json(propositions);  // Send the propositions as a JSON response
    } catch (error) {
        console.error('Error fetching propositions:', error);
        res.status(500).send("Internal Server Error");  // Send server error if there's an issue
    }
});


//--------------------INTERETS---------------------

// Ajouter un nouvel intérêt.
// Envoie une notification au proposeur en temps réel lorsqu’une demande est faite.
// Ajouter un nouvel intérêt + Notification en temps réel
app.post('/interests', (req, res) => {
    const { proposition_id, interested_user_id } = req.body;

    if (!proposition_id || !interested_user_id) {
        return res.status(400).json({ error: "Proposition ID et utilisateur intéressé sont requis." });
    }

    // 🔥 Étape 1 : Récupérer le nom de l'utilisateur intéressé
    const getUserNameSQL = `SELECT name FROM users WHERE id = ?`;

    con.query(getUserNameSQL, [interested_user_id], (err, userResult) => {
        if (err) {
            console.error("Erreur lors de la récupération de l'utilisateur :", err);
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }

        if (userResult.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        const interested_user_name = userResult[0].name; // 🔥 Récupération du nom

        // 🔥 Étape 2 : Insérer l'intérêt dans la base de données
        const insertInterestSQL = `
            INSERT INTO interests (proposition_id, interested_user_id, start_date, status) 
            VALUES (?, ?, NOW(), 'pending')
        `;

        con.query(insertInterestSQL, [proposition_id, interested_user_id], (err, result) => {
            if (err) {
                console.error("Erreur lors de l'insertion de l'intérêt :", err);
                return res.status(500).json({ error: "Erreur interne du serveur" });
            }

            const interestId = result.insertId; // 🔥 Récupérer l'ID de l'intérêt inséré

            // 🔥 Étape 3 : Récupérer l'ID du proposeur et le titre de l'offre
            const getProposerSQL = `SELECT proposer_id, title FROM propositions WHERE id = ?`;

            con.query(getProposerSQL, [proposition_id], (err, propositionResult) => {
                if (err) {
                    console.error("Erreur lors de la récupération de la proposition :", err);
                    return res.status(500).json({ error: "Erreur interne du serveur" });
                }

                if (propositionResult.length > 0) {
                    const proposer_id = propositionResult[0].proposer_id;
                    const title = propositionResult[0].title;

                    // 🔥 Étape 4 : Enregistrer la notification avec le nom et non l'ID
                    const insertNotifSQL = `
                        INSERT INTO notifications (user_id, type, message, related_entity_id) 
                        VALUES (?, ?, ?, ?)
                    `;

                    const notifMessage = `${interested_user_name} est intéressé(e) par votre offre : ${title}`;

                    con.query(insertNotifSQL, [proposer_id, "interest_request", notifMessage, interestId], (err, notifResult) => {
                        if (err) {
                            console.error("Erreur lors de l'insertion de la notification :", err);
                            return res.status(500).json({ error: "Erreur interne du serveur" });
                        }

                        // 🔥 Étape 5 : Émettre la notification en temps réel avec `type`
                        const io = req.app.get("socketio");
                        console.log("📡 Emission WebSocket : notification envoyée à", proposer_id);
                        io.emit(`notification-${proposer_id}`, { 
                            id: notifResult.insertId,  // 🔥 Ajout de l'ID pour permettre la suppression
                            message: notifMessage,
                            related_entity_id: interestId,
                            type: "interest_request"  // 🔥 Ajout du type pour éviter l'erreur dans le front
                        });                        
                        console.log("✅ WebSocket émis !");
                        res.status(201).json({ message: "Demande d'intérêt envoyée avec succès." });
                    });
                } else {
                    res.status(404).json({ error: "Proposition non trouvée." });
                }
            });
        });
    });
});
// modifier un intérêt existant par son ID.
//Envoie une notification en temps réel à l’intéressé quand sa demande est acceptée ou refusée.
//utiliser con au lieu de db
// 🔥 Modifier un intérêt (acceptation/refus) + Notifier en temps réel l'intéressé
app.put('/interests/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Statut invalide." });
    }

    // Mettre à jour le statut
    con.query("UPDATE interests SET status = ? WHERE id = ?", [status, id], (err, result) => {
        if (err) {
            console.error("Erreur SQL lors de la mise à jour de la demande :", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }

        // 🔥 Étape 1 : Récupérer les infos de la demande
        con.query("SELECT interested_user_id, proposition_id FROM interests WHERE id = ?", [id], (err, interestResults) => {
            if (err || interestResults.length === 0) {
                console.error("Erreur SQL lors de la récupération de la demande :", err);
                return res.status(500).json({ error: "Erreur serveur" });
            }

            const interested_user_id = interestResults[0].interested_user_id;
            const proposition_id = interestResults[0].proposition_id;

            // 🔥 Étape 2 : Récupérer les infos du proposeur
            con.query("SELECT proposer_id FROM propositions WHERE id = ?", [proposition_id], (err, proposerResults) => {
                if (err || proposerResults.length === 0) {
                    console.error("Erreur SQL lors de la récupération du proposeur :", err);
                    return res.status(500).json({ error: "Erreur serveur" });
                }

                const proposer_id = proposerResults[0].proposer_id;

                con.query("SELECT name, email, phone_number FROM users WHERE id = ?", [proposer_id], (err, proposerData) => {
                    if (err || proposerData.length === 0) {
                        console.error("Erreur SQL lors de la récupération des infos du proposeur :", err);
                        return res.status(500).json({ error: "Erreur serveur" });
                    }

                    const proposer_name = proposerData[0].name;
                    const proposer_email = proposerData[0].email;
                    const proposer_phone = proposerData[0].phone_number;

                    // 🔥 Construire le message en fonction du statut
                    const message = status === "accepted"
                        ? `🎉 ${proposer_name} a accepté votre demande pour \"Nettoyage de printemps\". Voici ses contacts : 📧 ${proposer_email} 📞 ${proposer_phone}`
                        : `❌ ${proposer_name} a refusé votre demande pour \"Nettoyage de printemps\".`;

                    // 🔥 Étape 3 : Enregistrer la notification avec l'ID
                    con.query("INSERT INTO notifications (user_id, type, message, related_entity_id) VALUES (?, ?, ?, ?)",
                        [interested_user_id, `interest_${status}`, message, proposition_id], (err, notifResult) => {
                            if (err) {
                                console.error("Erreur SQL lors de l'ajout de la notification :", err);
                                return res.status(500).json({ error: "Erreur serveur" });
                            }

                            const insertedNotifId = notifResult.insertId;

                            // 🔥 Étape 4 : Envoyer la notification en temps réel
                            const io = req.app.get("socketio");
                            io.emit(`notification-${interested_user_id}`, { 
                                id: insertedNotifId, 
                                message, 
                                related_entity_id: proposition_id,
                                type: `interest_${status}`
                            });

                            res.json({ message: `Demande ${status} avec succès.` });
                    });
                });
            });
        });
    });
});
app.get("/interests/received/:id", (req, res) => {
    /*
    C’est ce que fait la route /interests/received/:id.
	•	Cette route récupère les intérêts pour lesquels l’utilisateur est le proposer_id.
	•	Exemple : l’utilisateur a posté une annonce pour “Cleaning” → il voit toutes les personnes intéressées.
     */
    const userId = req.params.id; // ID de l'utilisateur (offreur)

    const query = `
        SELECT i.id, i.proposition_id, i.interested_user_id, i.start_date, i.end_date, i.status, i.created_at, i.updated_at,
               p.title AS proposition_title, p.description AS proposition_description,
               u.name AS interested_user_name, u.email AS interested_user_email
        FROM interests i
        JOIN propositions p ON i.proposition_id = p.id
        JOIN users u ON i.interested_user_id = u.id
        WHERE p.proposer_id = ?
    `;

    con.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching received interests for user:", err);
            return res.status(500).json({
                error: "An error occurred while fetching the interests received by the user."
            });
        }

        if (results.length === 0) {
            return res.json([]); // 🔥 Retourne une liste vide au lieu d'une erreur 404
        }

        res.json({
            message: "Here are the interests received by the user",
            data: results
        });
    });
});

app.put("/interests/users/:id", (req, res) => {
    const userId = req.params.id;
    const { start_date, end_date, status } = req.body;

    if (!start_date && !end_date && !status) {
        return res.status(400).json({
            error: "No fields provided to update."
        });
    }

    let fields = [];
    let values = [];
    if (start_date) {
        fields.push("start_date = ?");
        values.push(start_date);
    }
    if (end_date) {
        fields.push("end_date = ?");
        values.push(end_date);
    }
    if (status) {
        fields.push("status = ?");
        values.push(status);
    }

    values.push(userId);

    const query = `
        UPDATE interests
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE interested_user_id = ?
    `;

    con.query(query, values, (err, results) => {
        if (err) {
            console.error("Error updating interests for user:", err);
            return res.status(500).json({
                error: "An error occurred while updating the interests for the user."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "No interests found for this user."
            });
        }

        res.json({
            message: "Interests successfully updated for the user",
            updatedFields: { start_date, end_date, status }
        });
    });
});

app.delete("/interests/users/:id", (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    const query = `DELETE FROM interests WHERE interested_user_id = ?`;

    con.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error deleting interests for user:", err);
            return res.status(500).json({
                error: "An error occurred while deleting the interests for the user."
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: "No interests found for this user."
            });
        }

        res.json({
            message: "Interests successfully deleted for the user",
            deletedCount: results.affectedRows
        });
    });
});


// 🔥 Récupérer les demandes envoyées par l'utilisateur (avec email et numéro du proposeur)
app.get('/interests/sent/:userId', (req, res) => {
    const userId = req.params.userId;

    const getSentInterestsSQL = `
        SELECT i.id, i.status, p.title AS proposition_title, 
               u.email AS proposer_email, u.phone_number AS proposer_phone
        FROM interests i
        JOIN propositions p ON i.proposition_id = p.id
        JOIN users u ON p.proposer_id = u.id
        WHERE i.interested_user_id = ?
    `;

    con.query(getSentInterestsSQL, [userId], (err, results) => {
        if (err) {
            console.error("Erreur lors de la récupération des demandes envoyées :", err);
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }

        // 🔥 Reformater la réponse pour structurer correctement les contacts
        const formattedResults = results.map(interest => ({
            ...interest,
            proposer_contact: {
                email: interest.proposer_email,
                phone: interest.proposer_phone
            }
        }));

        res.json({ data: formattedResults });
    });
});

//--------------------UTILISATEURS---------------------

// Récupérer les coordonnées d'un utilisateur par ID
app.get("/users/:id/contact", (req, res) => {
    const userId = req.params.id;

    const query = `
        SELECT phone_number, email
        FROM users
        WHERE id = ?
    `;

    con.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Erreur lors de la récupération des coordonnées :", err);
            return res.status(500).json({
                error: "Une erreur est survenue lors de la récupération des coordonnées."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Utilisateur non trouvé."
            });
        }

        res.json({
            message: "Coordonnées récupérées avec succès.",
            data: results[0]
        });
    });
});

app.get("/users", (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
        SELECT id, name, email, phone_number, role, city_id, created_at, updated_at,quartier_id
        FROM users
        LIMIT ? OFFSET ?
    `;

    con.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res.status(500).json({
                error: "An error occurred while fetching users."
            });
        }

        res.json({
            message: "Here are the users",
            data: results,
            pagination: {
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            }
        });
    });
});

//--------------------NOTIFS---------------------


//  Créer une Notification (à appeler lorsqu’une demande d’intérêt est envoyée ou acceptée/refusée)
app.post("/notifications", (req, res) => {
    const { user_id, type, message, related_entity_id } = req.body;

    if (!user_id || !type || !message) {
        return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    const insertNotificationQuery = `
        INSERT INTO notifications (user_id, type, message, related_entity_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
    `;

    con.query(insertNotificationQuery, [user_id, type, message, related_entity_id], (err, result) => {
        if (err) return res.status(500).json({ error: "Erreur serveur lors de l'ajout de la notification." });

        const notificationData = {
            id: result.insertId,
            user_id,
            type,
            message,
            related_entity_id,
        };

        io.emit(`notification_${user_id}`, notificationData); // 🔥 Envoie la notif en temps réel
        res.status(201).json({ message: "Notification envoyée avec succès.", notificationData });
    });
});

app.get('/notifications/:userId', (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: "userId est requis." });
    }

    const sql = "SELECT * FROM notifications WHERE user_id = ?";
    con.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Erreur récupération des notifications :", err);
            return res.status(500).json({ error: "Erreur interne du serveur." });
        }

        if (result.length === 0) {
            return res.json([]); // 🔥 Retourne une liste vide au lieu d'une erreur 404
        }

        res.json(result);
    });
});

// 🔥 Supprimer une notification par ID
app.delete('/notifications/:id', (req, res) => {
    const notificationId = req.params.id;

    const deleteNotifSQL = `DELETE FROM notifications WHERE id = ?`;

    con.query(deleteNotifSQL, [notificationId], (err, result) => {
        if (err) {
            console.error("Erreur lors de la suppression de la notification :", err);
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }

        if (result.affectedRows > 0) {
            console.log(`🗑️ Notification ${notificationId} supprimée.`);
            res.json({ message: "Notification supprimée avec succès." });
        } else {
            res.status(404).json({ error: "Notification non trouvée." });
        }
    });
});

// 🔥 Supprimer toutes les notifications d'un utilisateur
app.delete('/notifications/all/:userId', (req, res) => {
    const userId = req.params.userId;

    const deleteAllNotifSQL = `DELETE FROM notifications WHERE user_id = ?`;

    con.query(deleteAllNotifSQL, [userId], (err, result) => {
        if (err) {
            console.error("Erreur lors de la suppression des notifications :", err);
            return res.status(500).json({ error: "Erreur interne du serveur" });
        }

        console.log(`🗑️ Toutes les notifications de l'utilisateur ${userId} supprimées.`);
        res.json({ message: "Toutes les notifications ont été supprimées." });
    });
});

//------------------------------SIGNALEMENTS------------------------------------

app.post('/signalements', (req, res) => {
    const { user_id, categorie, description, critique, quartier } = req.body;

    if (!user_id || !categorie || !description) {
        return res.status(400).json({ error: "Tous les champs obligatoires ne sont pas remplis." });
    }

    const sql = `INSERT INTO signalements (user_id, categorie, description, critique, quartier) VALUES (?, ?, ?, ?, ?)`;
    con.query(sql, [user_id, categorie, description, critique, quartier], (err, result) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur interne du serveur." });
        }

        const newSignalement = {
            id: result.insertId,
            user_id,
            categorie,
            description,
            critique,
            quartier,
            date_creation: new Date().toISOString()
        };

        // ✅ Envoi en temps réel via WebSockets
        const io = req.app.get("socketio");
        io.emit("new-signalement", newSignalement);

        // ✅ Envoi d'une notification si critique
        if (critique) {
            const notifMessage = `⚠️ Problème signalé dans votre quartier : ${description}`;

            // Récupérer tous les utilisateurs
            con.query("SELECT id FROM users", (err, users) => {
                if (err) {
                    console.error("Erreur récupération des utilisateurs :", err);
                    return res.status(500).json({ error: "Erreur interne du serveur." });
                }

                users.forEach(user => {
                    const userId = user.id;

                    // Insérer une notification pour chaque utilisateur
                    con.query(
                        "INSERT INTO notifications (user_id, type, message, related_entity_id) VALUES (?, ?, ?, ?)",
                        [userId, "danger_alert", notifMessage, result.insertId]
                    );

                    // ✅ Envoyer la notification en temps réel
                    io.to(`user_${userId}`).emit(`notification-${userId}`, {
                        id: result.insertId,
                        message: notifMessage,
                        type: "danger_alert",
                        related_entity_id: result.insertId
                    });
                });

                res.status(201).json({ message: "Signalement ajouté avec succès et notification envoyée." });
            });
        } else {
            res.status(201).json({ message: "Signalement ajouté avec succès." });
        }
    });
});

//récupération de tous les signalements
app.get('/signalements', (req, res) => {
    const sql = `SELECT * FROM signalements ORDER BY date_creation DESC`;
    con.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur interne du serveur." });
        }
        res.json({ signalements: results });
    });
});

//récupérer les signalements d'un utilisateur spécifique, pour la rubrique "mes signalements"
app.get('/signalements/utilisateur/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = `SELECT * FROM signalements WHERE user_id = ? ORDER BY date_creation DESC`;

    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ error: "Erreur interne du serveur." });
        }
        res.json({ signalements: results });
    });
});


// Marquer un signalement comme résolu et le renvoyer mis à jour
app.put('/signalements/:id/resoudre', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body; // Vérifie l'utilisateur

    // if (!user_id) {
    //     return res.status(400).json({ error: "Utilisateur non identifié." });
    // }

    const checkSql = `SELECT user_id FROM signalements WHERE id = ?`;
    con.query(checkSql, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: "Signalement introuvable." });
        }

        // if (results[0].user_id !== user_id) {
        //     return res.status(403).json({ error: "Vous ne pouvez pas résoudre un signalement qui ne vous appartient pas." });
        // }

        const updateSql = `UPDATE signalements SET resolu = TRUE WHERE id = ?`;
        con.query(updateSql, [id], (err, result) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur interne du serveur." });
            }

            // Récupérer le signalement mis à jour
            con.query(`SELECT * FROM signalements WHERE id = ?`, [id], (err, updatedResults) => {
                if (err) {
                    return res.status(500).json({ error: "Erreur lors de la récupération du signalement mis à jour." });
                }
                res.json({ message: "Signalement marqué comme résolu.", signalement: updatedResults[0] });
            });
        });
    });
});





// Démarrer le serveur
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀Serveur en écoute sur http://localhost:${PORT}`);
    });
}

module.exports = app;
