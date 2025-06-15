const User = require('../models/User');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const Wallet = require('../models/Wallet');
const { BadRequestError, UnauthorizedError } = require('../errors');

// Default categories to create for new users
const defaultCategories = [
  // Income categories
  { name: 'salary', type: 'income', icon: 'money-bill', color: '#4CAF50', isDefault: true },
  { name: 'freelance', type: 'income', icon: 'laptop', color: '#2196F3', isDefault: true },
  { name: 'investments', type: 'income', icon: 'chart-line', color: '#9C27B0', isDefault: true },
  
  // Expense categories
  { name: 'food', type: 'expense', icon: 'utensils', color: '#FF9800', isDefault: true },
  { name: 'transport', type: 'expense', icon: 'car', color: '#607D8B', isDefault: true },
  { name: 'utilities', type: 'expense', icon: 'bolt', color: '#FFC107', isDefault: true },
  { name: 'rent', type: 'expense', icon: 'home', color: '#E91E63', isDefault: true },
  { name: 'entertainment', type: 'expense', icon: 'film', color: '#795548', isDefault: true },
  { name: 'shopping', type: 'expense', icon: 'shopping-cart', color: '#009688', isDefault: true },
  { name: 'health', type: 'expense', icon: 'heartbeat', color: '#F44336', isDefault: true }
];

// Register User
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new BadRequestError('User already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Create default wallet
    await Wallet.create({
      userId: user._id,
      name: 'Main Wallet',
      currency: 'USD',
      balance: 0,
      isDefault: true
    });

    // Create default categories for the new user
    const categories = defaultCategories.map(category => ({
      ...category,
      userId: user.id
    }));
    await Category.insertMany(categories);

    // Create token
    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};