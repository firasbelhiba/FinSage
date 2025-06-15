const Transaction = require('../models/Transaction');

// Get all transactions for the logged-in user
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Add new transaction
exports.addTransaction = async (req, res) => {
  const { type, amount, category, description, date } = req.body;

  try {
    const newTransaction = new Transaction({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      date,
    });

    await newTransaction.save();
    res.json(newTransaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
