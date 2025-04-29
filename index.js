require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const projectRoutes = require('./routes/projects');
const propositionRoutes = require('./routes/propositions');
const categoryRoutes = require('./routes/categories');
const interestRoutes = require('./routes/interests');
const notificationRoutes = require('./routes/notifications');
const signalementRoutes = require('./routes/signalements');
const userRoutes = require('./routes/users');

// 🔧 Initialiser express
const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Créer le serveur WebSocket
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set("socketio", io);

// 📡 Logique de socket.io (identique à ta version stable)
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId || userId === "undefined") {
    console.warn("⚠️ Connexion WebSocket rejetée : userId est vide !");
    socket.disconnect();
    return;
  }

  console.log(`🟢 Connexion WebSocket - Utilisateur ${userId} (Socket ID: ${socket.id})`);
  socket.join(`user_${userId}`);

  socket.on("disconnect", () => {
    console.log(`🔴 Déconnexion - Utilisateur ${userId} (Socket ID: ${socket.id})`);
  });
});

// 📦 Routes API
app.use('/api/login', authRoutes);
app.use('/api/signup', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/propositions', propositionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('✅ API KnockNshare REST en ligne.');
});

// 🚀 Lancer l'API principale sur le port 3000
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur API REST en écoute sur http://localhost:${PORT}`);
  });
}

// 🔥 Lancer le WebSocket sur 5001 (séparé)
server.listen(5001, () => {
  console.log("✅ Serveur WebSocket démarré sur le port 5001");
});

module.exports = app;