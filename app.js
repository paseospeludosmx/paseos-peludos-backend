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

/* ---------- LOG extra para debug de body y headers en endpoints sensibles ---------- */
app.use((req, _res, next) => {
  if (req.method !== 'GET') {
    console.log(`➡️  ${req.method} ${req.originalUrl}`);
    if (req.headers['content-type']) {
      console.log('   content-type:', req.headers['content-type']);
    }
    if (req.originalUrl.includes('register') || req.originalUrl.includes('walker')) {
      console.log('   body:', JSON.stringify(req.body));
    }
  }
  next();
});

/* ----------------------- Rutas de la API ------------------------ */
// Rutas EXISTENTES (déjalas tal cual si existen en tu proyecto)
try {
  app.use('/api', require('./routes/authRoutes.js'));
} catch (e) {
  console.warn('⚠️  No se pudo montar authRoutes.js:', e.message);
}
try {
  // ⬅️  FIX: volvemos a montar walkerRoutes en /api
  // porque dentro del archivo usas rutas con prefijo '/walkers'
  // (si lo montas en /api/walkers te queda doble /walkers)
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

/* 👇 Rutas de paseos */
try {
  app.use('/api/walks', require('./routes/walksRoutes.js'));
} catch (e) {
  console.warn('⚠️  No se pudo montar walksRoutes.js:', e.message);
}

/* 👇 Admin Firebase Auth */
try {
  const adminUserRoutes = require('./routes/adminUserRoutes.js');
  app.use('/api', adminUserRoutes); // /api/admin/users
} catch (e) {
  console.warn('⚠️  No se pudo montar adminUserRoutes.js:', e.message);
}

/* 👇 Usuarios de la DB */
try {
  app.use('/api', require('./routes/appUsersRoutes.js')); // /api/app-users
} catch (e) {
  console.warn('⚠️  No se pudo montar appUsersRoutes.js:', e.message);
}

/* 👇 Registro de paseador (POST /api/walkers/register) */
try {
  app.use('/api', require('./routes/walkerRegisterRoutes.js'));
} catch (e) {
  console.warn('⚠️  No se pudo montar walkerRegisterRoutes.js:', e.message);
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

// Version
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

/* ----------------------- 404 ------------------------------- */
app.use((req, res) => {
  console.warn(`❓  404 en ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not found' });
});

/* ----------------------- Errores ------------------------------- */
app.use((err, _req, res, _next) => {
  console.error('💥 Unhandled error:', err);
  const expose = process.env.DEBUG_ERRORS === '1' || process.env.DEBUG_ERRORS === 'true';
  if (expose) {
    return res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      stack: err.stack,
      code: err.code || null
    });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
