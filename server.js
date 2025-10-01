// server.js
require('dotenv').config();
process.env.TZ = process.env.TZ || 'America/Mexico_City';

const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');

let Server;
try {
  ({ Server } = require('socket.io'));
} catch (e) {
  console.warn('⚠️  socket.io no está instalado. Ejecutando SIN WebSockets.');
  console.warn('   > Solución: npm i socket.io');
  Server = null;
}

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ------------------------------------------------------------------
// 🔌 MONTAJE DE RUTAS API (AÑADIDO)
//   Quedan disponibles en:
//   - GET  /api/walks/assigned?walkerId=...
//   - GET  /api/walks/my?clientId=...
//   - GET  /api/walks/assigned/today ...
//   - GET  /api/walks/my/today ...
//   - PATCH /api/walkers/:walkerId/availability
// ------------------------------------------------------------------
app.use('/api/walks', require('./routes/walksRoutes'));
app.use('/api/walkers', require('./routes/walkerRoutes'));

// Endpoint de salud en JSON (para pruebas desde la app)
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'paseos-api', time: new Date().toISOString() });
});
// ------------------------------------------------------------------

// HTTP server
const server = http.createServer(app);

// Socket.IO (dev-friendly CORS)
if (Server) {
  const io = new Server(server, {
    // Permite cualquier origin en dev para evitar bloqueos con clientes Node/CLI
    cors: { origin: true, credentials: true },
    connectionStateRecovery: {}
  });
  app.set('io', io);

  io.on('connection', (socket) => {
    socket.on('subscribe:walker', ({ walkerId }) => {
      if (!walkerId) return;
      socket.join(`walker:${walkerId}`);
      socket.emit('subscribed', { room: `walker:${walkerId}` });
    });

    socket.on('unsubscribe:walker', ({ walkerId }) => {
      if (!walkerId) return;
      socket.leave(`walker:${walkerId}`);
      socket.emit('unsubscribed', { room: `walker:${walkerId}` });
    });

    socket.on('location:update', ({ walkerId, point }) => {
      if (!walkerId || !point) return;
      io.to(`walker:${walkerId}`).emit('location:update', { walkerId, point });
    });

    socket.on('ping', () => socket.emit('pong'));
  });
} else {
  app.set('io', null);
}

// ---- Conexión a Mongo respetando la DB de la URI ----
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ Falta MONGO_URI en .env');
  process.exit(1);
}

const mongoOpts = {};
if (process.env.MONGO_DB) mongoOpts.dbName = process.env.MONGO_DB;

mongoose
  .connect(MONGO_URI, mongoOpts)
  .then(() => {
    console.log('✅ MongoDB conectado');
    server.listen(PORT, HOST, () => {
      console.log(`🚀 API en http://${HOST}:${PORT}${Server ? '  (sockets listos)' : '  (sin WebSockets)'}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => console.error('UNHANDLED REJECTION:', err));
process.on('uncaughtException', (err) => console.error('UNCAUGHT EXCEPTION:', err));
