const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { calculateDynamicPrice, calculateBookingTotal } = require('../utils/pricingEngine');

/**
 * @route   GET /api/pricing/:roomId
 * @access  Public
 * @query   date, checkIn, checkOut
 */
const getRoomPricing = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { date, checkIn, checkOut } = req.query;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Get active booking count for demand calculation
    const activeBookings = await Booking.countDocuments({
      roomId,
      status: { $in: ['confirmed', 'pending'] },
    });

    // If date range provided, calculate total
    if (checkIn && checkOut) {
      const pricing = calculateBookingTotal(room, new Date(checkIn), new Date(checkOut), activeBookings);
      return res.json({ success: true, data: pricing });
    }

    // Single date pricing
    const targetDate = date ? new Date(date) : new Date();
    const pricing = calculateDynamicPrice(room, targetDate, activeBookings);

    res.json({ success: true, data: pricing });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoomPricing };
