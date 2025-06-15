const Budget = require('../models/Budget');

// Add or Update budget
exports.addOrUpdateBudget = async (req, res) => {
  const { category, limit, month, year } = req.body;

  try {
    let budget = await Budget.findOne({ userId: req.user.id, category, month, year });
    if (budget) {
      budget.limit = limit;
      await budget.save();
      return res.json(budget);
    }

    budget = new Budget({ userId: req.user.id, category, limit, month, year });
    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
