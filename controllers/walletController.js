const Wallet = require('../models/Wallet');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all wallets for a user
const getWallets = async (req, res) => {
    const wallets = await Wallet.find({ userId: req.user.userId });
    res.status(200).json({
        success: true,
        count: wallets.length,
        data: wallets
    });
};

// Get single wallet
const getWallet = async (req, res) => {
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
};

// Create new wallet
const createWallet = async (req, res) => {
    const { name, currency, balance, isDefault } = req.body;

    // If this is set as default, unset any existing default wallet
    if (isDefault) {
        await Wallet.updateMany(
            { userId: req.user.userId, isDefault: true },
            { isDefault: false }
        );
    }

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
};

// Set initial balance
const setInitialBalance = async (req, res) => {
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
            isDefault: true
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
};

// Update wallet
const updateWallet = async (req, res) => {
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
};

// Delete wallet
const deleteWallet = async (req, res) => {
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

    await wallet.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
};

module.exports = {
    getWallets,
    getWallet,
    createWallet,
    setInitialBalance,
    updateWallet,
    deleteWallet
}; 