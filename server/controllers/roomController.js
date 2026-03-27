const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { calculateDynamicPrice } = require('../utils/pricingEngine');

/**
 * @route   GET /api/rooms/:hotelId
 * @access  Public
 */
const getRoomsByHotel = async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;
    const rooms = await Room.find({ hotelId: req.params.hotelId });

    const roomsWithPricing = await Promise.all(
      rooms.map(async (room) => {
        const activeBookings = await Booking.countDocuments({
          roomId: room._id,
          status: { $in: ['confirmed', 'pending'] },
        });

        const targetDate = checkIn ? new Date(checkIn) : new Date();
        const pricing = calculateDynamicPrice(room.toObject(), targetDate, activeBookings);

        // Check availability for date range
        let isAvailableForDates = room.availableRooms > 0;
        if (checkIn && checkOut) {
          const overlappingCount = await Booking.countDocuments({
            roomId: room._id,
            status: { $in: ['confirmed', 'pending'] },
            checkIn: { $lt: new Date(checkOut) },
            checkOut: { $gt: new Date(checkIn) },
          });
          isAvailableForDates = overlappingCount < room.totalRooms;
        }

        return {
          ...room.toObject(),
          dynamicPrice: pricing.finalPrice,
          priceBreakdown: pricing.breakdown,
          priceTags: pricing.tags,
          isAvailableForDates,
        };
      })
    );

    res.json({ success: true, data: roomsWithPricing });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoomsByHotel };
