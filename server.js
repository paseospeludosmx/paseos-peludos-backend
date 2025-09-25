// backend/server.js
const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

process.env.TZ = process.env.TZ || 'America/Mexico_City';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const MONGO_URI = process.env.MONGO_URI; // <— de tu .env

if (!MONGO_URI) {
  console.error('❌ Falta MONGO_URI en variables de entorno');
  process.exit(1);
}

mongoose.set('strictQuery', true);

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log('🟢 Conectado a MongoDB');
    app.listen(PORT, HOST, () =>
      console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

// Más robustez (opcional)
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
