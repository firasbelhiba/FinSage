const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budget');
const categoryRoutes = require('./routes/categories');
const walletRoutes = require('./routes/wallets');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/wallets', walletRoutes);

// Error handler (should be last piece of middleware)
app.use((err, req, res, next) => {
    console.error(err);

    // Handle custom errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            error: messages
        });
    }

    // Handle mongoose duplicate key errors
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            error: 'Duplicate field value entered'
        });
    }

    // Handle mongoose cast errors
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Server Error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
