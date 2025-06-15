const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticateUser } = require('../middleware/authentication');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all categories (with optional type filter)
router.get('/', getCategories);

// Get single category
router.get('/:id', getCategory);

// Create new category
router.post('/', createCategory);

// Update category
router.put('/:id', updateCategory);

// Delete category
router.delete('/:id', deleteCategory);

module.exports = router; 