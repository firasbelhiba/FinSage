const express = require('express');
const router = express.Router();
const { register, login, verifyToken } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/verify', auth, verifyToken);


module.exports = router;
