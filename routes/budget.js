const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudget,
  addOrUpdateBudget,
  deleteBudget
} = require('../controllers/budgetController');
const { authenticateUser } = require('../middleware/authentication');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all budgets (with optional month/year filter)
router.get('/', getBudgets);

// Get single budget
router.get('/:id', getBudget);

// Add or update budget
router.post('/', addOrUpdateBudget);

// Delete budget
router.delete('/:id', deleteBudget);

module.exports = router;
