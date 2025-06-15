const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all transactions
const getTransactions = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in getTransactions:', error);
        throw error;
    }
};

// Get single transaction
const getTransaction = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in getTransaction:', error);
        throw error;
    }
};

// Add transaction
const addTransaction = async (req, res) => {
    try {
        const { type, amount, category, description, date, walletId } = req.body;

        // Validate required fields
        if (!type || !amount || !category) {
            throw new BadRequestError('Please provide type, amount and category');
        }

        // Validate amount
        if (amount <= 0) {
            throw new BadRequestError('Amount must be greater than 0');
        }

        // Validate type
        if (!['income', 'expense'].includes(type)) {
            throw new BadRequestError('Type must be either income or expense');
        }

        // Find wallet - use provided walletId or default wallet
        let wallet;
        if (walletId) {
            wallet = await Wallet.findOne({
                _id: walletId,
                userId: req.user.userId
            });
        } else {
            // Find default wallet
            wallet = await Wallet.findOne({
                userId: req.user.userId,
                isDefault: true
            });
        }

        if (!wallet) {
            throw new NotFoundError('No wallet found. Please create a wallet first.');
        }

        // Create transaction
        const transaction = await Transaction.create({
            userId: req.user.userId,
            walletId: wallet._id,
            type,
            amount,
            category,
            description: description || '', // Make description optional
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
    } catch (error) {
        console.error('Error in addTransaction:', error);
        throw error;
    }
};

// Update transaction
const updateTransaction = async (req, res) => {
    try {
        const { type, amount, category, description, date, walletId } = req.body;
        
        console.log('Debug - Update Transaction Request:');
        console.log('Transaction ID from params:', req.params.id);
        console.log('User ID from request:', req.user.userId);
        console.log('Request body:', req.body);

        // Validate transaction ID
        if (!req.params.id) {
            throw new BadRequestError('Transaction ID is required');
        }

        // Find the transaction and log the query
        const transactionQuery = {
            _id: req.params.id,
            userId: req.user.userId
        };
        console.log('Finding transaction with query:', transactionQuery);

        const transaction = await Transaction.findOne(transactionQuery);
        console.log('Found transaction:', transaction ? {
            id: transaction._id,
            type: transaction.type,
            amount: transaction.amount,
            walletId: transaction.walletId,
            userId: transaction.userId
        } : 'No transaction found');

        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }

        // If walletId is missing, use the one from the request
        if (!transaction.walletId && walletId) {
            console.log('Adding missing walletId to transaction:', walletId);
            transaction.walletId = walletId;
        } else if (!transaction.walletId) {
            // If no walletId in transaction and none provided in request, find default wallet
            const defaultWallet = await Wallet.findOne({
                userId: req.user.userId,
                isDefault: true
            });
            
            if (!defaultWallet) {
                throw new Error('No default wallet found. Please provide a walletId.');
            }
            
            console.log('Using default wallet:', defaultWallet._id);
            transaction.walletId = defaultWallet._id;
        }

        // Get old wallet and new wallet (if changed)
        const oldWallet = await Wallet.findOne({
            _id: transaction.walletId,
            userId: req.user.userId
        });

        console.log('Found old wallet:', oldWallet ? {
            id: oldWallet._id,
            name: oldWallet.name,
            balance: oldWallet.balance
        } : 'No old wallet found');

        if (!oldWallet) {
            throw new NotFoundError('Original wallet not found');
        }

        let newWallet = oldWallet;
        if (walletId) {
            // Safely compare wallet IDs
            const currentWalletId = transaction.walletId.toString();
            const newWalletId = walletId.toString();
            
            console.log('Wallet ID comparison:', {
                currentWalletId,
                newWalletId,
                isDifferent: newWalletId !== currentWalletId
            });
            
            if (newWalletId !== currentWalletId) {
                newWallet = await Wallet.findOne({
                    _id: walletId,
                    userId: req.user.userId
                });
                console.log('Found new wallet:', newWallet ? {
                    id: newWallet._id,
                    name: newWallet.name,
                    balance: newWallet.balance
                } : 'No new wallet found');
                
                if (!newWallet) {
                    throw new NotFoundError('New wallet not found');
                }
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
    } catch (error) {
        console.error('Error in updateTransaction:', error);
        throw error;
    }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
    try {
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

        // Use deleteOne instead of remove
        await Transaction.deleteOne({ _id: transaction._id });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error in deleteTransaction:', error);
        throw error;
    }
};

module.exports = {
    getTransactions,
    getTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction
};
