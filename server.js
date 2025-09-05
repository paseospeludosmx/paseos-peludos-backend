// server.js
const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

// Conectar a MongoDB sin opciones obsoletas
mongoose.connect(process.env.DB_URI)
  .then(() => {
    console.log('🟢 Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
  });
