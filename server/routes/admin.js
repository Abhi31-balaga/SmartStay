const express = require('express');
const router = express.Router();
const { getAdminStats, getAllBookings } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/bookings', getAllBookings);

module.exports = router;
