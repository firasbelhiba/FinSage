const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 }, // store as cents if needed
  category: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for efficient querying
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, walletId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
