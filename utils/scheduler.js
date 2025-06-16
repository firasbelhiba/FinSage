const cron = require('node-cron');
const { executeScheduledTransactions } = require('../controllers/scheduledTransactionController');

// Run every day at midnight
const scheduleDailyCheck = () => {
    cron.schedule('0 0 * * *', async () => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        
        console.log(`Executing scheduled transactions for day ${dayOfMonth}`);
        await executeScheduledTransactions(dayOfMonth);
    });
};

module.exports = {
    scheduleDailyCheck
}; 