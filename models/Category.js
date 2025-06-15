const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify if this is an income or expense category']
  },
  icon: {
    type: String,
    default: 'default' // You can use this to store icon names or emojis
  },
  color: {
    type: String,
    default: '#000000' // Default color in hex
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure unique category names per user
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema); 