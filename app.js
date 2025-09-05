// app.js
const express = require('express');
const cors = require('cors');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Ruta de prueba principal ---
app.get('/', (req, res) => {
  res.send('🐾 Paseos Peludos API funcionando');
});

// --- Ruta de salud (healthcheck) ---
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'paseos-api',
    time: new Date().toISOString()
  });
});

module.exports = app;
