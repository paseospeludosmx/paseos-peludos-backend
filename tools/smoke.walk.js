// tools/smoke.walk.js
// Uso:
//   node tools/smoke.walk.js http://127.0.0.1:5000 CLIENT_EMAIL CLIENT_PASS WALKER_EMAIL WALKER_PASS
//
// Requisitos: backend levantado (npm run dev)

const API = process.argv[2] || process.env.API_URL || 'http://127.0.0.1:5000';
const CLIENT_EMAIL = process.argv[3];
const CLIENT_PASS  = process.argv[4];
const WALKER_EMAIL = process.argv[5];
const WALKER_PASS  = process.argv[6];

// Si tu ruta de login NO es /api/auth/login, cámbiala aquí:
const AUTH_LOGIN_PATH = '/api/auth/login';

if (!CLIENT_EMAIL || !CLIENT_PASS || !WALKER_EMAIL || !WALKER_PASS) {
  console.error('Uso: node tools/smoke.walk.js <API> <CLIENT_EMAIL> <CLIENT_PASS> <WALKER_EMAIL> <WALKER_PASS>');
  process.exit(1);
}

const headersJSON = { 'Content-Type': 'application/json' };

function pickToken(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return obj.token || obj.accessToken || obj.access_token ||
         (obj.data && (obj.data.token || obj.data.accessToken || obj.data.jwt)) ||
         obj.jwt || null;
}

async function login(email, password) {
  const res = await fetch(`${API}${AUTH_LOGIN_PATH}`, {
    method: 'POST',
    headers: headersJSON,
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login falló para ${email}: ${res.status} ${JSON.stringify(j)}`);
  }
  const token = pickToken(j);
  if (!token) throw new Error(`No encontré token en respuesta de login para ${email}: ${JSON.stringify(j)}`);
  return token;
}

async function getWalkerId(token, createIfMissing = true) {
  const url = `${API}/api/me/walker${createIfMissing ? '?createIfMissing=1' : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GET /me/walker falló: ${res.status} ${JSON.stringify(j)}`);
  return j.walkerId;
}

async function createWalk(tokenClient, walkerId) {
  const res = await fetch(`${API}/api/walks`, {
    method: 'POST',
    headers: { ...headersJSON, Authorization: `Bearer ${tokenClient}` },
    body: JSON.stringify({ walkerId, dogIds: [], notes: 'Inicio de paseo' }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST /walks falló: ${res.status} ${JSON.stringify(j)}`);
  return j.walk?._id || j.walk?.id || j.walk?.['_id'] || null;
}

async function trackPoint(tokenWalker, lat, lng) {
  const res = await fetch(`${API}/api/track`, {
    method: 'POST',
    headers: { ...headersJSON, Authorization: `Bearer ${tokenWalker}` },
    body: JSON.stringify({ lat, lng, accuracy: 5.5 }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST /track falló: ${res.status} ${JSON.stringify(j)}`);
  return j;
}

async function getWalk(token, walkId) {
  const res = await fetch(`${API}/api/walks/${walkId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GET /walks/${walkId} falló: ${res.status} ${JSON.stringify(j)}`);
  return j.walk;
}

async function finishWalk(tokenWalkerOrAdmin, walkId) {
  const res = await fetch(`${API}/api/walks/${walkId}/finish`, {
    method: 'PATCH',
    headers: { ...headersJSON, Authorization: `Bearer ${tokenWalkerOrAdmin}` },
    body: JSON.stringify({ price: 180, notes: 'Listo', status: 'finished' }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`PATCH /walks/${walkId}/finish falló: ${res.status} ${JSON.stringify(j)}`);
  return j.walk;
}

(async () => {
  console.log(`🔗 API: ${API}`);

  console.log('🔐 Login CLIENTE…');
  const tokenClient = await login(CLIENT_EMAIL, CLIENT_PASS);
  console.log('✅ Token cliente OK');

  console.log('🔐 Login PASEADOR…');
  const tokenWalker = await login(WALKER_EMAIL, WALKER_PASS);
  console.log('✅ Token paseador OK');

  console.log('🆔 Obteniendo walkerId…');
  const walkerId = await getWalkerId(tokenWalker, true);
  console.log('✅ walkerId =', walkerId);

  console.log('📝 Creando paseo…');
  const walkId = await createWalk(tokenClient, walkerId);
  if (!walkId) throw new Error('No obtuve walkId al crear paseo');
  console.log('✅ walkId =', walkId);

  console.log('📍 Enviando tracking 1/2…');
  await trackPoint(tokenWalker, 19.4326, -99.1332);

  console.log('📍 Enviando tracking 2/2…');
  await trackPoint(tokenWalker, 19.4330, -99.1340);

  console.log('🔎 Consultando paseo (polyline)…');
  const walk = await getWalk(tokenClient, walkId);
  console.log('➡️  polyline puntos =', Array.isArray(walk?.polyline) ? walk.polyline.length : 0);

  console.log('✅ Cerrando paseo…');
  const finished = await finishWalk(tokenWalker, walkId);
  console.log('🏁 status final =', finished?.status, ' endAt =', finished?.endAt);

  console.log('\n🎉 Flujo completo OK');
})().catch((e) => {
  console.error('\n❌ ERROR:', e.message);
  process.exit(1);
});
