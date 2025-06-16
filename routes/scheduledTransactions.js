const express = require('express');
const router = express.Router();
const {
    getScheduledTransactions,
    createScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction
} = require('../controllers/scheduledTransactionController');
const { authenticateUser } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateUser);

// Get all scheduled transactions
router.get('/', getScheduledTransactions);

// Create new scheduled transaction
router.post('/', createScheduledTransaction);

// Update scheduled transaction
router.put('/:id', updateScheduledTransaction);

// Delete scheduled transaction
router.delete('/:id', deleteScheduledTransaction);

module.exports = router; 