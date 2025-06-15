const User = require('../models/User');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');

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
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return next(new ErrorResponse('User already exists', 400));
    }

    // Create user
    user = new User({ email, password, name });
    await user.save();

    // Create default categories for the new user
    const categories = defaultCategories.map(category => ({
      ...category,
      userId: user.id
    }));
    await Category.insertMany(categories);

    // Create token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Create token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyToken = async (req, res) => {
  try {
    // Get the user from the database using the ID from the token
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Respond with the user data (excluding sensitive information)
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      message: "Token is valid"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};