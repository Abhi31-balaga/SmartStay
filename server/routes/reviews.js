const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

// GET /api/reviews/:hotelId
router.get('/:hotelId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ hotelId: req.params.hotelId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews
router.post('/', protect, async (req, res, next) => {
  try {
    const { hotelId, rating, comment, aspects, bookingId } = req.body;
    const review = await Review.create({
      userId: req.user._id,
      hotelId,
      rating,
      comment,
      aspects,
      bookingId,
    });
    const populated = await review.populate('userId', 'name avatar');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
