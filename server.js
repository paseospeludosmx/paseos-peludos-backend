// server.js
const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; // <— AQUÍ

if (!MONGO_URI) {
  console.error('❌ Falta MONGO_URI en variables de entorno');
  process.exit(1);
}

mongoose.set('strictQuery', true);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  .then(() => {
    console.log('🟢 Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });
