// app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

/* ----------------------- Middlewares base ----------------------- */
// Seguridad HTTP
app.use(helmet({ crossOriginResourcePolicy: false })); // permite servir imágenes/archivos si hace falta

// Logs de peticiones
app.use(morgan('tiny'));

// CORS con whitelist desde .env (FRONT_ORIGIN puede ser 1 o varias URLs separadas por coma)
const FRONT_ORIGIN = process.env.FRONT_ORIGIN
  ? process.env.FRONT_ORIGIN.split(',').map(s => s.trim())
  : null;

app.use(
  cors({
    origin: FRONT_ORIGIN && FRONT_ORIGIN.length ? FRONT_ORIGIN : true, // true = permite todo en dev
  })
);

// Body parser
app.use(express.json());

/* ----------------------- Rutas de la API ------------------------ */
// Rutas EXISTENTES (déjalas tal cual si existen en tu proyecto)
app.use('/api', require('./routes/authRoutes.js'));
app.use('/api', require('./routes/walkerRoutes.js'));
app.use('/api', require('./routes/reservationRoutes.js'));

// Rutas NUEVAS (asegúrate de que existan los archivos y controladores)
app.use('/api', require('./routes/walkRequestsRoutes.js'));     // POST /api/walk-requests
app.use('/api', require('./routes/paymentsRoutes.js'));         // /api/payments/...
app.use('/api', require('./routes/clarificationsRoutes.js'));   // /api/clarifications/...
app.use('/api', require('./routes/billingRoutes.js'));          // /api/billing/cash-quota

/* ----------------------- Utilidades ----------------------------- */
// Ruta principal
app.get('/', (_req, res) => {
  res.send('🐾 Paseos Peludos API funcionando');
});

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'paseos-api', time: new Date().toISOString() });
});

/* ----------------------- Errores ------------------------------- */
// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Manejo centralizado de errores
app.use(require('./middlewares/error'));

module.exports = app;
