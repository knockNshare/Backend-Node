require('dotenv').config({ path: './.env' }); 
const cors = require('cors');
const mysql = require('mysql2'); 
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const http = require("http");
const socketIo = require("socket.io");

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

// Lancer le serveur WebSocket
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
    const { name, email, phone_number, password, city_id } = req.body;

    if (!name || !email || !phone_number || !password || !city_id) {
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
        const insertUserQuery = 'INSERT INTO users (name, email, phone_number, password, city_id) VALUES (?, ?, ?, ?, ?)';
        con.query(insertUserQuery, [name, email, phone_number, password, city_id], (err, result) => {
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

// Route for creating an event
app.post('/api/events', (req, res) => {
    const { title, description, date, category, imageURL, address, latitude, longitude, creator_id } = req.body;

    const sql = 'INSERT INTO events (title, description, date, category, imageURL, address, latitude, longitude, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?,?,?)';
    con.query(sql, [title, description, date, category, imageURL, address, latitude, longitude, creator_id], (err, result) => {
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

//--------------------FIN_EVENTS---------------------

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
            console.log("🟢 Résultats trouvés :", results);
            // Return the matching propositions
            res.status(200).json(results);
        });
    });

    
});

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
        SELECT id, name, email, phone_number, role, city_id, created_at, updated_at
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




// Démarrer le serveur
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀Serveur en écoute sur http://localhost:${PORT}`);
    });
}

module.exports = app;
