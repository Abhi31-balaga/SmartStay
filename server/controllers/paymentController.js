const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { calculateBookingTotal } = require('../utils/pricingEngine');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

const validateBookingRequest = async ({ roomId, checkIn, checkOut, guestCount, specialRequests, userId }) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
    const error = new Error('Check-out must be after check-in'); error.statusCode = 400; throw error;
  }
  if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
    const error = new Error('Check-in cannot be in the past'); error.statusCode = 400; throw error;
  }
  const room = await Room.findById(roomId);
  if (!room) { const error = new Error('Room not found'); error.statusCode = 404; throw error; }
  if (room.availableRooms < 1) { const error = new Error('No rooms available for the selected dates'); error.statusCode = 400; throw error; }

  const overlappingBookingsCount = await Booking.countDocuments({
    roomId, status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate },
  });
  if (overlappingBookingsCount >= room.totalRooms) {
    const error = new Error('Room not available for the selected dates. Please choose different dates.'); error.statusCode = 409; throw error;
  }

  const activeBookings = await Booking.countDocuments({ roomId, status: { $in: ['confirmed', 'pending'] } });
  const pricing = calculateBookingTotal(room, checkInDate, checkOutDate, activeBookings);
  const booking = await Booking.create({
    userId, roomId, hotelId: room.hotelId, checkIn: checkInDate, checkOut: checkOutDate,
    totalPrice: pricing.totalPrice, priceBreakdown: { ...pricing.priceBreakdown, nights: pricing.nights },
    guestCount: guestCount || 1, specialRequests, status: 'pending', paymentStatus: 'pending',
  });
  return { booking, room, pricing };
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env.' });
    const { roomId, checkIn, checkOut, guestCount, specialRequests } = req.body;
    const { booking, room, pricing } = await validateBookingRequest({ roomId, checkIn, checkOut, guestCount, specialRequests, userId: req.user._id });
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(pricing.totalPrice * 100), currency: 'INR', receipt: booking.bookingRef,
        notes: { bookingId: booking._id.toString(), roomType: room.type },
      });
      booking.razorpayOrderId = order.id;
      await booking.save();
      return res.status(201).json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, bookingId: booking._id, bookingRef: booking.bookingRef, keyId: process.env.RAZORPAY_KEY_ID } });
    } catch (error) {
      await Booking.findByIdAndDelete(booking._id);
      throw error;
    }
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, bookingId } = req.body;
    if (!orderId || !paymentId || !signature || !bookingId) return res.status(400).json({ success: false, message: 'Incomplete Razorpay payment details.' });
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    if (expectedSignature !== signature) return res.status(400).json({ success: false, message: 'Invalid Razorpay payment signature.' });

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id, razorpayOrderId: orderId });
    if (!booking) return res.status(404).json({ success: false, message: 'Pending booking not found.' });
    if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') return res.json({ success: true, data: booking });

    booking.status = 'confirmed'; booking.paymentStatus = 'paid'; booking.razorpayPaymentId = paymentId; booking.razorpaySignature = signature;
    await booking.save();
    await Room.findByIdAndUpdate(booking.roomId, { $inc: { availableRooms: -1 } });
    res.json({ success: true, data: booking });
  } catch (error) { next(error); }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
