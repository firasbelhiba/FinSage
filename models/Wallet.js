const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    name: {
        type: String,
        required: true,
        default: 'Main Wallet'
    },
    isDefault: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure a user can only have one default wallet
walletSchema.index({ userId: 1, isDefault: 1 }, { 
    unique: true,
    partialFilterExpression: { isDefault: true }
});

module.exports = mongoose.model('Wallet', walletSchema); 