const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const { calculateBookingTotal } = require('../utils/pricingEngine');

/**
 * @route   POST /api/bookings
 * @access  Private (User)
 */
const createBooking = async (req, res, next) => {
  try {
    return res.status(402).json({
      success: false,
      message: 'Payment is required. Create a Razorpay order before confirming a booking.',
    });

    const { roomId, checkIn, checkOut, guestCount, specialRequests } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ success: false, message: 'Check-out must be after check-in' });
    }

    if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ success: false, message: 'Check-in cannot be in the past' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.availableRooms < 1) {
      return res.status(400).json({ success: false, message: 'No rooms available for the selected dates' });
    }

    // === BOOKING CONFLICT DETECTION ===
    const conflictingBooking = await Booking.findOne({
      roomId,
      status: { $in: ['confirmed', 'pending'] },
      // Overlapping condition: newCheckIn < existingCheckOut AND newCheckOut > existingCheckIn
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    // Note: For simplicity with totalRooms > 1, we check if overbooked
    const overlappingBookingsCount = await Booking.countDocuments({
      roomId,
      status: { $in: ['confirmed', 'pending'] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (overlappingBookingsCount >= room.totalRooms) {
      return res.status(409).json({
        success: false,
        message: 'Room not available for the selected dates. Please choose different dates.',
      });
    }

    // Get active bookings count for demand pricing
    const activeBookings = await Booking.countDocuments({
      roomId,
      status: { $in: ['confirmed', 'pending'] },
    });

    // Calculate total price with dynamic pricing
    const pricing = calculateBookingTotal(room, checkInDate, checkOutDate, activeBookings);

    // Create the booking
    const booking = await Booking.create({
      userId: req.user._id,
      roomId,
      hotelId: room.hotelId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: pricing.totalPrice,
      priceBreakdown: {
        ...pricing.priceBreakdown,
        nights: pricing.nights,
      },
      guestCount: guestCount || 1,
      specialRequests,
    });

    // Update room availability
    await Room.findByIdAndUpdate(roomId, { $inc: { availableRooms: -1 } });

    // Populate for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('roomId', 'type basePrice hotelId')
      .populate('hotelId', 'name location')
      .populate('userId', 'name email');

    // Emit socket event for real-time update
    if (req.io) {
      req.io.emit('booking_created', {
        roomId,
        hotelId: room.hotelId,
        availableRooms: room.availableRooms - 1,
        booking: populatedBooking,
      });
    }

    res.status(201).json({ success: true, data: populatedBooking, pricing });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bookings/user
 * @access  Private
 */
const getUserBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('roomId', 'type basePrice images')
      .populate('hotelId', 'name location images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({ success: true, data: bookings, total });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('roomId', 'type basePrice amenities maxOccupancy bedType images')
      .populate('hotelId', 'name location images amenities policies')
      .populate('userId', 'name email');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only booking owner or admin can view
    if (booking.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/bookings/:id
 * @access  Private
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only owner or admin can cancel
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Restore room availability
    await Room.findByIdAndUpdate(booking.roomId, { $inc: { availableRooms: 1 } });

    // Emit real-time update
    if (req.io) {
      req.io.emit('booking_cancelled', {
        roomId: booking.roomId,
        hotelId: booking.hotelId,
        bookingId: booking._id,
      });
    }

    res.json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getUserBookings, getBooking, cancelBooking };
