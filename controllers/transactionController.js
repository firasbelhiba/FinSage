const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');

// Get all transactions for the logged-in user
exports.getTransactions = async (req, res, next) => {
  try {
    const { month, year, type, category } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // Add filters if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 });
    
    // Calculate totals
    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }
      return acc;
    }, { income: 0, expense: 0 });

    res.json({
      success: true,
      count: transactions.length,
      totals,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// Get single transaction
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return next(new ErrorResponse('Transaction not found', 404));
    }

    res.json({
      success: true,
      data: transaction
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

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return next(new ErrorResponse('Type must be either income or expense', 400));
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

// Update transaction
exports.updateTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;

    // Find transaction
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return next(new ErrorResponse('Transaction not found', 404));
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return next(new ErrorResponse('Amount must be greater than 0', 400));
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return next(new ErrorResponse('Type must be either income or expense', 400));
    }

    // Update fields
    if (type) transaction.type = type;
    if (amount) transaction.amount = amount;
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = date;

    await transaction.save();

    res.json({
      success: true,
      data: transaction
    });
  } catch (err) {
    next(err);
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return next(new ErrorResponse('Transaction not found', 404));
    }

    await transaction.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
