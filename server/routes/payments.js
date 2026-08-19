const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);

module.exports = router;
