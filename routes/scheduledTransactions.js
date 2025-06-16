const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication');
const {
    getScheduledTransactions,
    createScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
    executeScheduledTransactions,
} = require('../controllers/scheduledTransactionController');

// Protect all routes
router.use(authenticateUser);

// Get all scheduled transactions
router.get('/', getScheduledTransactions);

// Create new scheduled transaction
router.post('/', createScheduledTransaction);

// Update scheduled transaction
router.put('/:id', updateScheduledTransaction);

// Delete scheduled transaction
router.delete('/:id', deleteScheduledTransaction);

// Execute scheduled transactions
router.post('/execute', executeScheduledTransactions);

module.exports = router; 