const express = require('express');
const router = express.Router();
const { initFirebaseAdmin } = require('../utils/firebaseAdmin');

// Protección simple por header (solo desarrollo)
// En producción sustituye por tu auth real (verificación de token + roles).
function requireAdminKey(req, res, next) {
  const key = req.header('X-Admin-Key');
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

// GET /api/admin/users?limit=100&nextPageToken=...
router.get('/admin/users', requireAdminKey, async (req, res) => {
  const limitRaw = parseInt(req.query.limit || '100', 10);
  const limit = Math.min(Math.max(limitRaw, 1), 1000);
  const nextPageToken = req.query.nextPageToken || undefined;

  try {
    const admin = initFirebaseAdmin();
    const list = await admin.auth().listUsers(limit, nextPageToken);

    const users = list.users.map(u => ({
      uid: u.uid,
      email: u.email || null,
      displayName: u.displayName || null,
      phoneNumber: u.phoneNumber || null,
      photoURL: u.photoURL || null,
      disabled: u.disabled,
      metadata: {
        creationTime: u.metadata.creationTime,
        lastSignInTime: u.metadata.lastSignInTime,
      },
      providerData: u.providerData,
    }));

    res.json({
      ok: true,
      count: users.length,
      nextPageToken: list.pageToken || null,
      users,
    });
  } catch (e) {
    console.error('list users error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
