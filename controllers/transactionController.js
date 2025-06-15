const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');

// Get all transactions for the logged-in user
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 });
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// Add new transaction
exports.addTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;

    // Validate required fields
    if (!type || !amount || !category) {
      return next(new ErrorResponse('Please provide type, amount and category', 400));
    }

    // Validate amount
    if (amount <= 0) {
      return next(new ErrorResponse('Amount must be greater than 0', 400));
    }

    const newTransaction = new Transaction({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      date: date || Date.now()
    });

    await newTransaction.save();
    
    res.status(201).json({
      success: true,
      data: newTransaction
    });
  } catch (err) {
    next(err);
  }
};
