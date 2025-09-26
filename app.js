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
    credentials: true,
  })
);

// Body parser
app.use(express.json());

/* ----------------------- Rutas de la API ------------------------ */
// Rutas EXISTENTES (déjalas tal cual si existen en tu proyecto)
try {
  app.use('/api', require('./routes/authRoutes.js'));
} catch (e) {
  console.warn('⚠️  No se pudo montar authRoutes.js:', e.message);
}
try {
  app.use('/api', require('./routes/walkerRoutes.js'));
} catch (e) {
  console.warn('⚠️  No se pudo montar walkerRoutes.js:', e.message);
}
try {
  app.use('/api', require('./routes/reservationRoutes.js'));
} catch (e) {
  console.warn('⚠️  No se pudo montar reservationRoutes.js:', e.message);
}

// Rutas NUEVAS (asegúrate de que existan los archivos y controladores)
try {
  app.use('/api', require('./routes/walkRequestsRoutes.js')); // POST /api/walk-requests
} catch (e) {
  console.warn('⚠️  No se pudo montar walkRequestsRoutes.js:', e.message);
}
try {
  app.use('/api', require('./routes/paymentsRoutes.js')); // /api/payments/...
} catch (e) {
  console.warn('⚠️  No se pudo montar paymentsRoutes.js:', e.message);
}
try {
  app.use('/api', require('./routes/clarificationsRoutes.js')); // /api/clarifications/...
} catch (e) {
  console.warn('⚠️  No se pudo montar clarificationsRoutes.js:', e.message);
}
try {
  app.use('/api', require('./routes/billingRoutes.js')); // /api/billing/cash-quota
} catch (e) {
  console.warn('⚠️  No se pudo montar billingRoutes.js:', e.message);
}

/* ----------------------- Utilidades ----------------------------- */
// Ruta principal
app.get('/', (_req, res) => {
  res.send('🐾 Paseos Peludos API funcionando');
});

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'paseos-api', time: new Date().toISOString() });
});

// Version (útil para diagnósticos y despliegues)
app.get('/version', (_req, res) => {
  res.json({
    name: 'paseos-peludos-backend',
    version: (() => {
      try {
        return require('./package.json').version || '0.0.0';
      } catch {
        return '0.0.0';
      }
    })(),
    commit: process.env.GIT_COMMIT || null,
    env: process.env.NODE_ENV || 'development',
  });
});

/* ----------------------- Errores ------------------------------- */
// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Manejo centralizado de errores
try {
  app.use(require('./middlewares/error'));
} catch (e) {
  // Si no existe el middleware aún, devolvemos un handler simple
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
}

module.exports = app;
