const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Standard', 'Deluxe', 'Suite', 'Executive', 'Presidential'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0,
    },
    totalRooms: {
      type: Number,
      required: true,
      min: 1,
    },
    availableRooms: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: [{ type: String }],
    maxOccupancy: { type: Number, default: 2 },
    size: { type: Number }, // in sq ft
    bedType: { type: String, enum: ['Single', 'Double', 'Queen', 'King', 'Twin'], default: 'Double' },
    images: [{ type: String }],
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
