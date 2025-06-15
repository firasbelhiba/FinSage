const express = require('express');
const router = express.Router();
const { addOrUpdateBudget } = require('../controllers/budgetController');
const auth = require('../middleware/auth');

router.post('/', auth, addOrUpdateBudget);

module.exports = router;
