const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let initialized = false;

/**
 * Inicializa Firebase Admin tomando credenciales de:
 * 1) FIREBASE_SERVICE_ACCOUNT_JSON: JSON entero en una sola línea (string)
 * 2) FIREBASE_SERVICE_ACCOUNT_FILE: ruta al archivo JSON (Opción A)
 */
function initFirebaseAdmin() {
  if (initialized) return admin;

  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;

  let creds;

  if (jsonRaw && jsonRaw.trim().startsWith('{')) {
    try {
      creds = JSON.parse(jsonRaw);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no contiene JSON válido');
    }
  } else if (filePath) {
    const abs = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (!fs.existsSync(abs)) {
      throw new Error(`No se encontró el archivo de service account en: ${abs}`);
    }
    const content = fs.readFileSync(abs, 'utf8');
    try {
      creds = JSON.parse(content);
    } catch (e) {
      throw new Error('Archivo de service account no contiene JSON válido');
    }
  } else {
    throw new Error('Debes definir FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_FILE en .env');
  }

  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });

  initialized = true;
  return admin;
}

module.exports = { initFirebaseAdmin };
