const Budget = require('../models/Budget');
const ErrorResponse = require('../utils/errorResponse');

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
