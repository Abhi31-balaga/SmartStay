const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const User = require('../models/User');

/**
 * @route   GET /api/admin/stats
 * @access  Admin only
 */
const getAdminStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Aggregated stats
    const [totalBookings, totalUsers, totalHotels, totalRooms] = await Promise.all([
      Booking.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Hotel.countDocuments({ isActive: true }),
      Room.countDocuments(),
    ]);

    // Revenue calculations
    const revenueData = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          avgBookingValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Popular hotels by bookings
    const popularHotels = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$hotelId', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'hotels',
          localField: '_id',
          foreignField: '_id',
          as: 'hotel',
        },
      },
      { $unwind: '$hotel' },
      { $project: { 'hotel.name': 1, 'hotel.location': 1, bookings: 1, revenue: 1 } },
    ]);

    // Occupancy rate
    const totalRoomsCount = await Room.aggregate([
      { $group: { _id: null, total: { $sum: '$totalRooms' }, available: { $sum: '$availableRooms' } } },
    ]);

    const occupancyData = totalRoomsCount[0] || { total: 0, available: 0 };
    const occupancyRate =
      occupancyData.total > 0
        ? Math.round(((occupancyData.total - occupancyData.available) / occupancyData.total) * 100)
        : 0;

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('hotelId', 'name location')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const registeredUsers = await User.find({ role: 'user' })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          totalUsers,
          totalHotels,
          totalRooms,
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          avgBookingValue: Math.round(revenueData[0]?.avgBookingValue || 0),
          occupancyRate,
        },
        monthlyRevenue,
        popularHotels,
        recentBookings,
        registeredUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/bookings
 * @access  Admin only
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('hotelId', 'name location')
      .populate('roomId', 'type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({ success: true, data: bookings, total });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminStats, getAllBookings };
