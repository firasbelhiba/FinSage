const Budget = require('../models/Budget');
const ErrorResponse = require('../utils/errorResponse');

// Get all budgets for a user
exports.getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // Add month and year to query if provided
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const budgets = await Budget.find(query).sort({ category: 1 });

    // Calculate total budget
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);

    res.json({
      success: true,
      count: budgets.length,
      totalBudget,
      data: budgets
    });
  } catch (err) {
    next(err);
  }
};

// Get single budget
exports.getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (err) {
    next(err);
  }
};

// Add or Update budget
exports.addOrUpdateBudget = async (req, res, next) => {
  try {
    const { category, limit, month, year } = req.body;

    // Validate required fields
    if (!category || !limit || !month || !year) {
      return next(new ErrorResponse('Please provide category, limit, month and year', 400));
    }

    // Validate month
    if (month < 1 || month > 12) {
      return next(new ErrorResponse('Month must be between 1 and 12', 400));
    }

    // Validate limit
    if (limit <= 0) {
      return next(new ErrorResponse('Limit must be greater than 0', 400));
    }

    // Check if budget exists
    let budget = await Budget.findOne({ 
      userId: req.user.id, 
      category, 
      month, 
      year 
    });

    if (budget) {
      // Update existing budget
      budget.limit = limit;
      await budget.save();
      
      return res.json({
        success: true,
        data: budget
      });
    }

    // Create new budget
    budget = new Budget({
      userId: req.user.id,
      category,
      limit,
      month,
      year
    });

    await budget.save();

    res.status(201).json({
      success: true,
      data: budget
    });
  } catch (err) {
    next(err);
  }
};

// Delete budget
exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!budget) {
      return next(new ErrorResponse('Budget not found', 404));
    }

    await budget.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
