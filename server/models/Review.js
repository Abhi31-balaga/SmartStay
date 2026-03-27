const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters'],
    },
    aspects: {
      cleanliness: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },
  },
  { timestamps: true }
);

// One review per user per hotel
reviewSchema.index({ userId: 1, hotelId: 1 }, { unique: true });

// Update hotel average rating after review save
reviewSchema.post('save', async function () {
  const Hotel = require('./Hotel');
  const stats = await this.constructor.aggregate([
    { $match: { hotelId: this.hotelId } },
    {
      $group: {
        _id: '$hotelId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  if (stats.length > 0) {
    await Hotel.findByIdAndUpdate(this.hotelId, {
      'rating.average': Math.round(stats[0].avgRating * 10) / 10,
      'rating.count': stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
