const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/app-users?role=cliente|paseador|admin&search=txt&page=1&limit=20
router.get('/app-users', async (req, res) => {
  try {
    const { role, search = '', page = 1, limit = 20 } = req.query;
    const q = {};
    if (role) q.role = role;
    if (search) {
      q.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * perPage;

    const [items, total] = await Promise.all([
      User.find(q).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
      User.countDocuments(q),
    ]);

    res.json({ ok: true, total, page: pageNum, limit: perPage, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/app-users/_stats  (conteo por rol)
router.get('/app-users/_stats', async (_req, res) => {
  try {
    const agg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } },
      { $sort: { role: 1 } },
    ]);
    res.json({ ok: true, stats: agg });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
