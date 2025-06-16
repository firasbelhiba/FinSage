const ScheduledTransaction = require('../models/ScheduledTransaction');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all scheduled transactions for a user
const getScheduledTransactions = async (req, res) => {
    try {
        const scheduledTransactions = await ScheduledTransaction.find({
            userId: req.user.userId
        }).sort({ dayOfMonth: 1 });

        res.status(200).json({
            success: true,
            data: scheduledTransactions
        });
    } catch (error) {
        console.error('Error in getScheduledTransactions:', error);
        throw error;
    }
};

// Create a new scheduled transaction
const createScheduledTransaction = async (req, res) => {
    try {
        const { type, amount, category, description, dayOfMonth, walletId, affectBalance } = req.body;

        // Validate required fields
        if (!type || !amount || !category || !dayOfMonth || !walletId) {
            throw new BadRequestError('Please provide type, amount, category, dayOfMonth and walletId');
        }

        // Validate amount
        if (amount <= 0) {
            throw new BadRequestError('Amount must be greater than 0');
        }

        // Validate type
        if (!['income', 'expense'].includes(type)) {
            throw new BadRequestError('Type must be either income or expense');
        }

        // Validate day of month
        if (dayOfMonth < 1 || dayOfMonth > 31) {
            throw new BadRequestError('Day of month must be between 1 and 31');
        }

        // Find wallet
        const wallet = await Wallet.findOne({
            _id: walletId,
            userId: req.user.userId
        });

        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }

        // Create scheduled transaction
        const scheduledTransaction = await ScheduledTransaction.create({
            userId: req.user.userId,
            walletId: wallet._id,
            type,
            amount,
            category,
            description: description || '',
            dayOfMonth,
            affectBalance: affectBalance !== undefined ? affectBalance : true
        });

        res.status(201).json({
            success: true,
            data: scheduledTransaction
        });
    } catch (error) {
        console.error('Error in createScheduledTransaction:', error);
        throw error;
    }
};

// Update a scheduled transaction
const updateScheduledTransaction = async (req, res) => {
    try {
        const { type, amount, category, description, dayOfMonth, walletId, isActive, affectBalance } = req.body;

        const scheduledTransaction = await ScheduledTransaction.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!scheduledTransaction) {
            throw new NotFoundError('Scheduled transaction not found');
        }

        // Update fields if provided
        if (type) scheduledTransaction.type = type;
        if (amount) scheduledTransaction.amount = amount;
        if (category) scheduledTransaction.category = category;
        if (description !== undefined) scheduledTransaction.description = description;
        if (dayOfMonth) scheduledTransaction.dayOfMonth = dayOfMonth;
        if (isActive !== undefined) scheduledTransaction.isActive = isActive;
        if (affectBalance !== undefined) scheduledTransaction.affectBalance = affectBalance;
        if (walletId) {
            const wallet = await Wallet.findOne({
                _id: walletId,
                userId: req.user.userId
            });
            if (!wallet) {
                throw new NotFoundError('Wallet not found');
            }
            scheduledTransaction.walletId = wallet._id;
        }

        await scheduledTransaction.save();

        res.status(200).json({
            success: true,
            data: scheduledTransaction
        });
    } catch (error) {
        console.error('Error in updateScheduledTransaction:', error);
        throw error;
    }
};

// Delete a scheduled transaction
const deleteScheduledTransaction = async (req, res) => {
    try {
        const scheduledTransaction = await ScheduledTransaction.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!scheduledTransaction) {
            throw new NotFoundError('Scheduled transaction not found');
        }

        await scheduledTransaction.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error in deleteScheduledTransaction:', error);
        throw error;
    }
};

// Execute scheduled transactions for a given day
const executeScheduledTransactions = async (dayOfMonth) => {
    try {
        const scheduledTransactions = await ScheduledTransaction.find({
            dayOfMonth,
            isActive: true
        });

        for (const scheduled of scheduledTransactions) {
            // Check if already executed this month
            const now = new Date();
            const lastExecuted = scheduled.lastExecuted;
            if (lastExecuted && 
                lastExecuted.getMonth() === now.getMonth() && 
                lastExecuted.getFullYear() === now.getFullYear()) {
                continue;
            }

            // Create the actual transaction
            const transaction = await Transaction.create({
                userId: scheduled.userId,
                walletId: scheduled.walletId,
                type: scheduled.type,
                amount: scheduled.amount,
                category: scheduled.category,
                description: scheduled.description,
                date: new Date(),
                affectBalance: scheduled.affectBalance
            });

            // Update wallet balance if needed
            if (scheduled.affectBalance) {
                const wallet = await Wallet.findById(scheduled.walletId);
                if (wallet) {
                    if (scheduled.type === 'income') {
                        wallet.balance += scheduled.amount;
                    } else {
                        if (wallet.balance < scheduled.amount) {
                            console.error(`Insufficient balance for scheduled transaction ${scheduled._id}`);
                            continue;
                        }
                        wallet.balance -= scheduled.amount;
                    }
                    wallet.lastUpdated = new Date();
                    await wallet.save();
                }
            }

            // Update last executed date
            scheduled.lastExecuted = new Date();
            await scheduled.save();
        }
    } catch (error) {
        console.error('Error executing scheduled transactions:', error);
    }
};

module.exports = {
    getScheduledTransactions,
    createScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
    executeScheduledTransactions
}; 