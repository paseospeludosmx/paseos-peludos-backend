// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
// ❌ Antes: app.use(cors({ origin: '*', credentials: true }));
// ✅ Ahora: CORS simple sin credentials
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api', require('./routes/authRoutes'));

// Ruta principal
app.get('/', (req, res) => {
  res.send('🐾 Paseos Peludos API funcionando');
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'paseos-api', time: new Date().toISOString() });
});

module.exports = app;
