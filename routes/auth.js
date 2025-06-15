const express = require('express');
const router = express.Router();
const { register, login, verifyToken, getCurrentUser } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authentication');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/verify', authenticateUser, verifyToken);
router.get('/me', authenticateUser, getCurrentUser);

module.exports = router;
