const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all transactions
const getTransactions = async (req, res) => {
    const { month, year, type, category, walletId } = req.query;
    const query = { userId: req.user.userId };

    // Add filters if provided
    if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        query.date = { $gte: startDate, $lte: endDate };
    }
    if (type) query.type = type;
    if (category) query.category = category;
    if (walletId) query.walletId = walletId;

    const transactions = await Transaction.find(query).sort({ date: -1 });

    // Calculate totals
    const totals = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.income += transaction.amount;
        } else {
            acc.expense += transaction.amount;
        }
        return acc;
    }, { income: 0, expense: 0 });

    res.status(200).json({
        success: true,
        count: transactions.length,
        totals,
        data: transactions
    });
};

// Get single transaction
const getTransaction = async (req, res) => {
    const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user.userId
    });

    if (!transaction) {
        throw new NotFoundError('Transaction not found');
    }

    res.status(200).json({
        success: true,
        data: transaction
    });
};

// Add transaction
const addTransaction = async (req, res) => {
    const { type, amount, category, description, date, walletId } = req.body;

    // Validate wallet exists and belongs to user
    const wallet = await Wallet.findOne({
        _id: walletId,
        userId: req.user.userId
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    // Create transaction
    const transaction = await Transaction.create({
        userId: req.user.userId,
        walletId,
        type,
        amount,
        category,
        description,
        date: date || Date.now()
    });

    // Update wallet balance
    if (type === 'income') {
        wallet.balance += amount;
    } else {
        if (wallet.balance < amount) {
            throw new BadRequestError('Insufficient balance in wallet');
        }
        wallet.balance -= amount;
    }
    wallet.lastUpdated = Date.now();
    await wallet.save();

    res.status(201).json({
        success: true,
        data: transaction
    });
};

// Update transaction
const updateTransaction = async (req, res) => {
    const { type, amount, category, description, date, walletId } = req.body;

    const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user.userId
    });

    if (!transaction) {
        throw new NotFoundError('Transaction not found');
    }

    // Get old wallet and new wallet (if changed)
    const oldWallet = await Wallet.findOne({
        _id: transaction.walletId,
        userId: req.user.userId
    });

    let newWallet = oldWallet;
    if (walletId && walletId !== transaction.walletId.toString()) {
        newWallet = await Wallet.findOne({
            _id: walletId,
            userId: req.user.userId
        });
        if (!newWallet) {
            throw new NotFoundError('New wallet not found');
        }
    }

    // Calculate balance changes
    const oldAmount = transaction.amount;
    const newAmount = amount || oldAmount;
    const oldType = transaction.type;
    const newType = type || oldType;

    // Update old wallet balance
    if (oldType === 'income') {
        oldWallet.balance -= oldAmount;
    } else {
        oldWallet.balance += oldAmount;
    }
    oldWallet.lastUpdated = Date.now();
    await oldWallet.save();

    // Update new wallet balance
    if (newType === 'income') {
        newWallet.balance += newAmount;
    } else {
        if (newWallet.balance < newAmount) {
            throw new BadRequestError('Insufficient balance in wallet');
        }
        newWallet.balance -= newAmount;
    }
    newWallet.lastUpdated = Date.now();
    await newWallet.save();

    // Update transaction
    if (type) transaction.type = type;
    if (amount) transaction.amount = amount;
    if (category) transaction.category = category;
    if (description) transaction.description = description;
    if (date) transaction.date = date;
    if (walletId) transaction.walletId = walletId;

    await transaction.save();

    res.status(200).json({
        success: true,
        data: transaction
    });
};

// Delete transaction
const deleteTransaction = async (req, res) => {
    const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user.userId
    });

    if (!transaction) {
        throw new NotFoundError('Transaction not found');
    }

    // Update wallet balance
    const wallet = await Wallet.findOne({
        _id: transaction.walletId,
        userId: req.user.userId
    });

    if (transaction.type === 'income') {
        wallet.balance -= transaction.amount;
    } else {
        wallet.balance += transaction.amount;
    }
    wallet.lastUpdated = Date.now();
    await wallet.save();

    await transaction.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
};

module.exports = {
    getTransactions,
    getTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction
};
