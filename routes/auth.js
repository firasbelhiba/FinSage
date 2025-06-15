const express = require('express');
const router = express.Router();
const { register, login, verifyToken } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authentication');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/verify', authenticateUser, verifyToken);

module.exports = router;
