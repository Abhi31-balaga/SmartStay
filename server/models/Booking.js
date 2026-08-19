const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceBreakdown: {
      basePrice: Number,
      demandCharge: Number,
      weekendCharge: Number,
      seasonCharge: Number,
      availabilityDiscount: Number,
      nights: Number,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed', 'pending'],
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'paid',
    },
    stripeSessionId: { type: String, default: '' },
    guestCount: { type: Number, default: 1 },
    specialRequests: { type: String, default: '' },
    bookingRef: { type: String, unique: true },
  },
  { timestamps: true }
);

// Generate booking reference before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingRef) {
    this.bookingRef = 'SS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  next();
});

// Validate checkOut > checkIn
bookingSchema.pre('save', function (next) {
  if (this.checkOut <= this.checkIn) {
    next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
