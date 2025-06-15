const User = require('../models/User');
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');

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