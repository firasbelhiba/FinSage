const scheduledTransactionsRouter = require('./routes/scheduledTransactions');
const { scheduleDailyCheck } = require('./utils/scheduler');

// Routes
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/scheduled-transactions', scheduledTransactionsRouter);

// Start the scheduler
scheduleDailyCheck(); 