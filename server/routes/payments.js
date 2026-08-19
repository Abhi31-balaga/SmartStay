const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/checkout-session', protect, createCheckoutSession);

module.exports = router;
