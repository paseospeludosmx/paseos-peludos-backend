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
  console.warn('   > Si lo necesitas: npm i socket.io');
  Server = null;
}

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ❗️Importante: las rutas y /health se montan en app.js, no aquí.
// (Tu app.js ya las monta. No dupliquemos.)

// HTTP server
const server = http.createServer(app);

// Socket.IO (dev-friendly CORS)
if (Server) {
  const io = new Server(server, {
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

// Opciones recomendadas (no agregan puerto; solo timeouts/reintentos)
const mongoOpts = {
  // Solo define dbName si QUIERES sobreescribir la DB de la URI:
  ...(process.env.MONGO_DB ? { dbName: process.env.MONGO_DB } : {}),
  serverSelectionTimeoutMS: 10000,
  retryWrites: true
};

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
