const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, getBooking, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect); // All booking routes require auth

router.post('/', createBooking);
router.get('/user', getUserBookings);
router.get('/:id', getBooking);
router.delete('/:id', cancelBooking);

module.exports = router;
