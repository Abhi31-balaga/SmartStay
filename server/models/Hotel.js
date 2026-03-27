const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
    },
    location: {
      city: { type: String, required: true },
      address: { type: String, required: true },
      country: { type: String, default: 'India' },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    images: [{ type: String }],
    amenities: [{ type: String }],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: { type: Boolean, default: true },
    starCategory: { type: Number, enum: [1, 2, 3, 4, 5], default: 3 },
    policies: {
      checkIn: { type: String, default: '14:00' },
      checkOut: { type: String, default: '11:00' },
      cancellation: { type: String, default: 'Free cancellation up to 24 hours before check-in' },
    },
  },
  { timestamps: true }
);

// Index for search
hotelSchema.index({ 'location.city': 'text', name: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);
