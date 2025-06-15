const Category = require('../models/Category');
const ErrorResponse = require('../utils/errorResponse');

// Get all categories for a user
exports.getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    
    // Build query
    const query = { userId: req.user.userId };
    
    // Add type filter if provided
    if (type) {
      query.type = type;
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};

// Get single category
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Create new category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    // Validate required fields
    if (!name || !type) {
      return next(new ErrorResponse('Please provide name and type', 400));
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return next(new ErrorResponse('Type must be either income or expense', 400));
    }

    // Check if category already exists for this user
    const existingCategory = await Category.findOne({
      userId: req.user.userId,
      name: name.toLowerCase()
    });

    if (existingCategory) {
      return next(new ErrorResponse('Category already exists', 400));
    }

    const category = await Category.create({
      userId: req.user.userId,
      name: name.toLowerCase(),
      type,
      icon: icon || 'default',
      color: color || '#000000'
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    // Find category
    let category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Don't allow updating default categories
    if (category.isDefault) {
      return next(new ErrorResponse('Cannot update default category', 400));
    }

    // Check if new name already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        userId: req.user.userId,
        name: name.toLowerCase()
      });

      if (existingCategory) {
        return next(new ErrorResponse('Category name already exists', 400));
      }
    }

    // Update fields
    if (name) category.name = name.toLowerCase();
    if (type) category.type = type;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!category) {
      return next(new ErrorResponse('Category not found', 404));
    }

    // Don't allow deleting default categories
    if (category.isDefault) {
      return next(new ErrorResponse('Cannot delete default category', 400));
    }

    await category.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 