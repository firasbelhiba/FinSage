const Wallet = require('../models/Wallet');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all wallets for a user
const getWallets = async (req, res) => {
    try {
        const wallets = await Wallet.find({ userId: req.user.userId });
        res.status(200).json({
            success: true,
            count: wallets.length,
            data: wallets
        });
    } catch (error) {
        console.error('Error in getWallets:', error);
        throw error;
    }
};

// Get single wallet
const getWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }

        res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        console.error('Error in getWallet:', error);
        throw error;
    }
};

// Create new wallet
const createWallet = async (req, res) => {
    try {
        const { name, currency, balance, isDefault } = req.body;

        // Validate required fields
        if (!name || !currency) {
            throw new BadRequestError('Please provide name and currency');
        }

        // Validate balance if provided
        if (balance !== undefined && balance < 0) {
            throw new BadRequestError('Balance cannot be negative');
        }

        // If this is set as default, unset any existing default wallet
        if (isDefault) {
            await Wallet.updateMany(
                { userId: req.user.userId, isDefault: true },
                { isDefault: false }
            );
        }

        // Create wallet
        const wallet = await Wallet.create({
            userId: req.user.userId,
            name,
            currency,
            balance: balance || 0,
            isDefault: isDefault || false
        });

        res.status(201).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        console.error('Error in createWallet:', error);
        if (error.code === 11000) {
            throw new BadRequestError('A default wallet already exists');
        }
        throw error;
    }
};

// Set initial balance
const setInitialBalance = async (req, res) => {
    try {
        const { balance, currency } = req.body;

        if (!balance || balance < 0) {
            throw new BadRequestError('Please provide a valid initial balance');
        }

        // Find or create default wallet
        let wallet = await Wallet.findOne({
            userId: req.user.userId,
            isDefault: true
        });

        if (!wallet) {
            wallet = await Wallet.create({
                userId: req.user.userId,
                balance,
                currency: currency || 'USD',
                isDefault: true,
                name: 'Main Wallet'
            });
        } else {
            wallet.balance = balance;
            if (currency) wallet.currency = currency;
            wallet.lastUpdated = Date.now();
            await wallet.save();
        }

        res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        console.error('Error in setInitialBalance:', error);
        throw error;
    }
};

// Update wallet
const updateWallet = async (req, res) => {
    try {
        const { name, currency, isDefault } = req.body;

        const wallet = await Wallet.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }

        // If setting as default, unset any existing default wallet
        if (isDefault) {
            await Wallet.updateMany(
                { userId: req.user.userId, isDefault: true },
                { isDefault: false }
            );
        }

        if (name) wallet.name = name;
        if (currency) wallet.currency = currency;
        if (typeof isDefault === 'boolean') wallet.isDefault = isDefault;
        wallet.lastUpdated = Date.now();

        await wallet.save();

        res.status(200).json({
            success: true,
            data: wallet
        });
    } catch (error) {
        console.error('Error in updateWallet:', error);
        if (error.code === 11000) {
            throw new BadRequestError('A default wallet already exists');
        }
        throw error;
    }
};

// Delete wallet
const deleteWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }

        if (wallet.isDefault) {
            throw new BadRequestError('Cannot delete default wallet');
        }

        await Wallet.deleteOne({ _id: wallet._id });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error in deleteWallet:', error);
        throw error;
    }
};

module.exports = {
    getWallets,
    getWallet,
    createWallet,
    setInitialBalance,
    updateWallet,
    deleteWallet
}; 