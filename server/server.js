require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const pricingRoutes = require('./routes/pricing');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const { handleStripeWebhook } = require('./controllers/paymentController');

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Connect Database
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Attach socket.io to req so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SmartStay API' });
});

// Stripe requires the unparsed request body for webhook signature verification.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join hotel room to receive hotel-specific updates
  socket.on('join_hotel', (hotelId) => {
    socket.join(`hotel_${hotelId}`);
    console.log(`Socket ${socket.id} joined hotel_${hotelId}`);
  });

  socket.on('leave_hotel', (hotelId) => {
    socket.leave(`hotel_${hotelId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 SmartStay Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = { app, io };
