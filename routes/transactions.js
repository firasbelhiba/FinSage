const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Get all transactions (with optional filters)
router.get('/', getTransactions);

// Get single transaction
router.get('/:id', getTransaction);

// Add new transaction
router.post('/', addTransaction);

// Update transaction
router.put('/:id', updateTransaction);

// Delete transaction
router.delete('/:id', deleteTransaction);

module.exports = router;
