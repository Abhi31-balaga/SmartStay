const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

/**
 * @route   GET /api/hotels
 * @access  Public
 * @query   city, minPrice, maxPrice, minRating, page, limit
 */
const getHotels = async (req, res, next) => {
  try {
    const { city, minPrice, maxPrice, minRating, page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    // Filter by city (case-insensitive)
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Filter by minimum rating
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    const skip = (page - 1) * limit;

    let hotels = await Hotel.find(query)
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Attach min room price for each hotel
    const hotelIds = hotels.map((h) => h._id);
    const rooms = await Room.find({ hotelId: { $in: hotelIds } }).lean();

    hotels = hotels.map((hotel) => {
      const hotelRooms = rooms.filter((r) => r.hotelId.toString() === hotel._id.toString());
      const minRoomPrice = hotelRooms.length ? Math.min(...hotelRooms.map((r) => r.basePrice)) : 0;
      const hasAvailability = hotelRooms.some((r) => r.availableRooms > 0);
      return { ...hotel, minPrice: minRoomPrice, hasAvailability, roomCount: hotelRooms.length };
    });

    // Filter by price range after joining room prices
    const filtered = hotels.filter((h) => {
      if (minPrice && h.minPrice < parseFloat(minPrice)) return false;
      if (maxPrice && h.minPrice > parseFloat(maxPrice)) return false;
      return true;
    });

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: filtered,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/hotels/:id
 * @access  Public
 */
const getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const rooms = await Room.find({ hotelId: hotel._id }).lean();

    res.json({ success: true, data: { ...hotel, rooms } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/hotels
 * @access  Admin / Hotel Owner
 */
const createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create({ ...req.body, ownerId: req.user._id });
    res.status(201).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/hotels/cities
 * @access  Public
 */
const getCities = async (req, res, next) => {
  try {
    const cities = await Hotel.distinct('location.city', { isActive: true });
    res.json({ success: true, data: cities.sort() });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHotels, getHotel, createHotel, getCities };
