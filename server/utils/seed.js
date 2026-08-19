require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Remove the legacy index from the old user schema before inserting users.
  const userIndexes = await User.collection.indexes();
  if (userIndexes.some((index) => index.name === 'username_1')) {
    await User.collection.dropIndex('username_1');
  }

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Hotel.deleteMany({}),
    Room.deleteMany({}),
  ]);

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  const [admin, user1, user2] = await User.insertMany([
    { name: 'Admin User', email: 'admin@smartstay.com', password: adminPassword, role: 'admin' },
    { name: 'Arjun Sharma', email: 'arjun@example.com', password: userPassword, role: 'user' },
    { name: 'Priya Patel', email: 'priya@example.com', password: userPassword, role: 'user' },
  ]);

  // Hotel data
  const hotelsData = [
    {
      name: 'The Grand Hyatt Mumbai',
      location: { city: 'Mumbai', address: 'Off Western Express Highway, Santacruz East', country: 'India' },
      description: 'A luxury 5-star hotel in the heart of Mumbai offering world-class amenities, fine dining, and breathtaking city views. Perfect for business and leisure travelers.',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      ],
      amenities: ['Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Business Center', 'Rooftop Restaurant', 'Bar & Lounge', 'Free WiFi', 'Concierge', 'Valet Parking', 'Airport Shuttle'],
      rating: { average: 4.7, count: 328 },
      starCategory: 5,
      policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation up to 48 hours before check-in' },
    },
    {
      name: 'Taj Mahal Palace Delhi',
      location: { city: 'Delhi', address: '1 Mansingh Road, New Delhi', country: 'India' },
      description: 'An iconic heritage hotel blending colonial grandeur with modern luxury. Home to legendary restaurants, a magnificent pool, and impeccable Taj hospitality since 1903.',
      images: [
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800',
        'https://images.unsplash.com/photo-1540541338537-1220059d4ead?w=800',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
      ],
      amenities: ['Heritage Architecture', 'Multiple Restaurants', 'Outdoor Pool', 'Spa', 'Butler Service', 'Fitness Center', 'Business Center', 'Free WiFi', 'Concierge', 'Limousine Service'],
      rating: { average: 4.9, count: 512 },
      starCategory: 5,
      policies: { checkIn: '14:00', checkOut: '12:00', cancellation: 'Free cancellation up to 72 hours before check-in' },
    },
    {
      name: 'Leela Palace Bangalore',
      location: { city: 'Bangalore', address: '23 Airport Road, Kodihalli', country: 'India' },
      description: 'A palatial luxury hotel featuring Dravidian architecture, lush gardens, and an award-winning spa. Situated near the IT corridor, ideal for corporate stays and leisure.',
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
      ],
      amenities: ['Infinity Pool', 'Ayurvedic Spa', 'Rooftop Bar', 'Fine Dining', 'Tennis Court', 'Fitness Center', 'Free WiFi', 'Helipad', 'Concierge', 'Electric Vehicle Charging'],
      rating: { average: 4.8, count: 241 },
      starCategory: 5,
      policies: { checkIn: '15:00', checkOut: '11:00', cancellation: 'Free cancellation up to 48 hours before check-in' },
    },
    {
      name: 'ITC Grand Chola Chennai',
      location: { city: 'Chennai', address: '63 Mount Road, Guindy', country: 'India' },
      description: 'A magnificent tribute to the Chola dynasty, this eco-friendly luxury hotel features the largest hotel pool in India and multiple award-winning restaurants.',
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
      ],
      amenities: ['Largest Hotel Pool in India', 'Spa', '5 Restaurants', 'Business Center', 'Fitness Center', 'Green Building', 'Free WiFi', 'Concierge', 'Valet Parking'],
      rating: { average: 4.6, count: 189 },
      starCategory: 5,
    },
    {
      name: 'Courtyard by Marriott Pune',
      location: { city: 'Pune', address: 'Senapati Bapat Road, Shivajinagar', country: 'India' },
      description: 'A contemporary business hotel offering smart design, modern amenities, and a vibrant social atmosphere. Perfect for the modern traveler exploring Pune\'s culture and IT hubs.',
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      ],
      amenities: ['Outdoor Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Free WiFi', 'Business Center', 'Meeting Rooms'],
      rating: { average: 4.3, count: 156 },
      starCategory: 4,
    },
    {
      name: 'Novotel Hyderabad Convention Centre',
      location: { city: 'Hyderabad', address: 'HICC Complex, Madhapur', country: 'India' },
      description: 'Connected to the Hyderabad International Convention Centre, this upscale hotel is the preferred choice for conferences, MICE events, and leisure travelers exploring Cyberabad.',
      images: [
        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800',
        'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=800',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
      ],
      amenities: ['Convention Center Access', 'Multiple Pools', 'Spa', 'Kids Club', 'Multiple Restaurants', 'Free WiFi', 'Business Center'],
      rating: { average: 4.4, count: 203 },
      starCategory: 4,
    },
    {
      name: 'Lemon Tree Premier Kolkata',
      location: { city: 'Kolkata', address: 'Plot No. 3/1, Block EM, Sector V, Salt Lake', country: 'India' },
      description: 'A stylish upscale hotel in the heart of Kolkata\'s IT district offering contemporary rooms, fresh cuisine, and exceptional service at accessible price points.',
      images: [
        'https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=800',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
        'https://images.unsplash.com/photo-1587213811864-c958e9f5be4b?w=800',
      ],
      amenities: ['Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Free WiFi', 'Business Center', 'Meeting Rooms', 'Laundry'],
      rating: { average: 4.2, count: 98 },
      starCategory: 4,
    },
    {
      name: 'Radisson Blu Jaipur',
      location: { city: 'Jaipur', address: 'Tonk Road, Durgapura', country: 'India' },
      description: 'Set amidst lush green gardens in the Pink City, this contemporary hotel offers a perfect blend of Rajasthani heritage aesthetics with modern comforts and facilities.',
      images: [
        'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800',
        'https://images.unsplash.com/photo-1551016548-aa4825904b79?w=800',
        'https://images.unsplash.com/photo-1562790351-d273a961e0e9?w=800',
      ],
      amenities: ['Outdoor Pool', 'Spa', 'Rooftop Restaurant', 'Fitness Center', 'Free WiFi', 'Cultural Shows', 'Concierge'],
      rating: { average: 4.5, count: 174 },
      starCategory: 4,
    },
  ];

  const hotels = await Hotel.insertMany(hotelsData);

  // Room types per hotel
  const roomTypes = [
    { type: 'Standard', basePrice: 4500, totalRooms: 20, availableRooms: 15, bedType: 'Queen', maxOccupancy: 2, size: 320 },
    { type: 'Deluxe', basePrice: 7500, totalRooms: 15, availableRooms: 10, bedType: 'King', maxOccupancy: 2, size: 420 },
    { type: 'Suite', basePrice: 14000, totalRooms: 8, availableRooms: 5, bedType: 'King', maxOccupancy: 3, size: 650 },
    { type: 'Executive', basePrice: 11000, totalRooms: 10, availableRooms: 7, bedType: 'King', maxOccupancy: 2, size: 520 },
  ];

  const luxuryRoomTypes = [
    { type: 'Standard', basePrice: 8500, totalRooms: 30, availableRooms: 20, bedType: 'Queen', maxOccupancy: 2, size: 380 },
    { type: 'Deluxe', basePrice: 13000, totalRooms: 20, availableRooms: 14, bedType: 'King', maxOccupancy: 2, size: 480 },
    { type: 'Suite', basePrice: 25000, totalRooms: 10, availableRooms: 3, bedType: 'King', maxOccupancy: 4, size: 850 },
    { type: 'Presidential', basePrice: 55000, totalRooms: 2, availableRooms: 1, bedType: 'King', maxOccupancy: 4, size: 1400 },
  ];

  const allRooms = [];
  hotels.forEach((hotel, idx) => {
    const types = idx < 4 ? luxuryRoomTypes : roomTypes;
    types.forEach((rt) => {
      allRooms.push({
        hotelId: hotel._id,
        ...rt,
        amenities: ['Air Conditioning', 'Flat Screen TV', 'Mini Bar', 'Safe', 'Free WiFi', 'Room Service'],
        images: hotel.images,
        description: `Spacious ${rt.type} room with premium furnishings and modern amenities.`,
      });
    });
  });

  await Room.insertMany(allRooms);

  console.log(`✅ Seeded: ${hotels.length} hotels, ${allRooms.length} rooms, 3 users`);
  console.log('\n📧 Test Accounts:');
  console.log('  Admin: admin@smartstay.com / admin123');
  console.log('  User:  arjun@example.com / user123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
