const Stripe = require('stripe');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { calculateBookingTotal } = require('../utils/pricingEngine');

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const validateBookingRequest = async ({ roomId, checkIn, checkOut, guestCount, specialRequests, userId }) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
    const error = new Error('Check-out must be after check-in');
    error.statusCode = 400;
    throw error;
  }

  if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
    const error = new Error('Check-in cannot be in the past');
    error.statusCode = 400;
    throw error;
  }

  const room = await Room.findById(roomId);
  if (!room) {
    const error = new Error('Room not found');
    error.statusCode = 404;
    throw error;
  }

  if (room.availableRooms < 1) {
    const error = new Error('No rooms available for the selected dates');
    error.statusCode = 400;
    throw error;
  }

  const overlappingBookingsCount = await Booking.countDocuments({
    roomId,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });

  if (overlappingBookingsCount >= room.totalRooms) {
    const error = new Error('Room not available for the selected dates. Please choose different dates.');
    error.statusCode = 409;
    throw error;
  }

  const activeBookings = await Booking.countDocuments({ roomId, status: { $in: ['confirmed', 'pending'] } });
  const pricing = calculateBookingTotal(room, checkInDate, checkOutDate, activeBookings);
  const booking = await Booking.create({
    userId,
    roomId,
    hotelId: room.hotelId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    totalPrice: pricing.totalPrice,
    priceBreakdown: { ...pricing.priceBreakdown, nights: pricing.nights },
    guestCount: guestCount || 1,
    specialRequests,
    status: 'pending',
    paymentStatus: 'pending',
  });

  return { booking, room, pricing };
};

const createCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env.' });
    }

    const { roomId, checkIn, checkOut, guestCount, specialRequests } = req.body;
    const { booking, room, pricing } = await validateBookingRequest({
      roomId,
      checkIn,
      checkOut,
      guestCount,
      specialRequests,
      userId: req.user._id,
    });

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: req.user.email,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'inr',
            unit_amount: Math.round(pricing.totalPrice * 100),
            product_data: {
              name: `SmartStay ${room.type} room`,
              description: `${checkIn} to ${checkOut}`,
            },
          },
        }],
        metadata: { bookingId: booking._id.toString() },
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?payment=success`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/hotels?payment=cancelled`,
      });

      booking.stripeSessionId = session.id;
      await booking.save();
      return res.status(201).json({ success: true, data: { checkoutUrl: session.url, bookingId: booking._id } });
    } catch (error) {
      await Booking.findByIdAndDelete(booking._id);
      throw error;
    }
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

const handleStripeWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: 'Stripe webhook is not configured.' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${error.message}` });
  }

  const session = event.data.object;
  const bookingId = session.metadata?.bookingId;
  if (bookingId && event.type === 'checkout.session.completed') {
    const booking = await Booking.findById(bookingId);
    if (booking && booking.status === 'pending') {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      await booking.save();
      await Room.findByIdAndUpdate(booking.roomId, { $inc: { availableRooms: -1 } });
    }
  }

  if (bookingId && event.type === 'checkout.session.expired') {
    await Booking.findOneAndUpdate({ _id: bookingId, status: 'pending' }, { status: 'cancelled', paymentStatus: 'failed' });
  }

  res.json({ received: true });
};

module.exports = { createCheckoutSession, handleStripeWebhook };
