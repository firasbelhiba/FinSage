const express = require('express');
const router = express.Router();
const {
    getWallets,
    getWallet,
    createWallet,
    setInitialBalance,
    updateWallet,
    deleteWallet
} = require('../controllers/walletController');
const { authenticateUser } = require('../middleware/authentication');

router.use(authenticateUser);

router.route('/')
    .get(getWallets)
    .post(createWallet);

router.route('/initial-balance')
    .post(setInitialBalance);

router.route('/:id')
    .get(getWallet)
    .put(updateWallet)
    .delete(deleteWallet);

module.exports = router; 