const express = require('express');
const router = express.Router();

const { registerWalker, registerClient, login, me } = require('../controllers/authController.js');
const auth = require('../middlewares/auth.js'); // OJO: carpeta plural

router.post('/auth/register-walker', registerWalker);
router.post('/auth/login', login);
router.get('/auth/me', auth, me);
router.post('/auth/register-client', registerClient);


module.exports = router;
