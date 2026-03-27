const express = require('express');
const router = express.Router();
const { getRoomPricing } = require('../controllers/pricingController');

router.get('/:roomId', getRoomPricing);

module.exports = router;
