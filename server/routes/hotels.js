const express = require('express');
const router = express.Router();
const { getHotels, getHotel, createHotel, getCities } = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getHotels);
router.get('/cities', getCities);
router.get('/:id', getHotel);
router.post('/', protect, authorize('admin'), createHotel);

module.exports = router;
