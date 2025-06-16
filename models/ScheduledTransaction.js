const mongoose = require('mongoose');

const scheduledTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  dayOfMonth: { type: Number, required: true, min: 1, max: 31 },
  isActive: { type: Boolean, default: true },
  lastExecuted: { type: Date },
  affectBalance: { type: Boolean, default: true },
}, { timestamps: true });

// Index for efficient querying
scheduledTransactionSchema.index({ userId: 1, dayOfMonth: 1 });
scheduledTransactionSchema.index({ isActive: 1 });

const ScheduledTransaction = mongoose.model('ScheduledTransaction', scheduledTransactionSchema);

module.exports = ScheduledTransaction; 