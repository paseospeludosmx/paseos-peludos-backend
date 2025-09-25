// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas EXISTENTES (déjalas tal cual)
app.use('/api', require('./routes/authRoutes.js'));
app.use('/api', require('./routes/walkerRoutes.js'));
app.use('/api', require('./routes/reservationRoutes.js'));

// Rutas NUEVAS (asegúrate de crear estos archivos en /routes y sus controladores)
app.use('/api', require('./routes/walkRequestsRoutes.js'));     // POST /api/walk-requests
app.use('/api', require('./routes/paymentsRoutes.js'));         // /api/payments/...
app.use('/api', require('./routes/clarificationsRoutes.js'));   // /api/clarifications/...
app.use('/api', require('./routes/billingRoutes.js'));          // /api/billing/cash-quota

// Ruta principal
app.get('/', (req, res) => {
  res.send('🐾 Paseos Peludos API funcionando');
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'paseos-api', time: new Date().toISOString() });
});

module.exports = app;
