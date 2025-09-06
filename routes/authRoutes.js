// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerWalker, registerClient, login, me } = require('../controllers/authController');
const auth = require('../middlewares/auth');

router.post('/auth/register-walker', registerWalker);
router.post('/auth/register-client', registerClient);
router.post('/auth/login', login);
router.get('/auth/me', auth, me);

module.exports = router;
