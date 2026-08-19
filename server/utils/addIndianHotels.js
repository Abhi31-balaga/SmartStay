require('dotenv').config();
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');

const states = [
  ['Andhra Pradesh', 'Visakhapatnam'], ['Arunachal Pradesh', 'Itanagar'], ['Assam', 'Guwahati'],
  ['Bihar', 'Patna'], ['Chhattisgarh', 'Raipur'], ['Goa', 'Panaji'], ['Gujarat', 'Ahmedabad'],
  ['Haryana', 'Gurugram'], ['Himachal Pradesh', 'Shimla'], ['Jharkhand', 'Ranchi'],
  ['Karnataka', 'Bengaluru'], ['Kerala', 'Kochi'], ['Madhya Pradesh', 'Indore'], ['Maharashtra', 'Mumbai'],
  ['Manipur', 'Imphal'], ['Meghalaya', 'Shillong'], ['Mizoram', 'Aizawl'], ['Nagaland', 'Kohima'],
  ['Odisha', 'Bhubaneswar'], ['Punjab', 'Amritsar'], ['Rajasthan', 'Jaipur'], ['Sikkim', 'Gangtok'],
  ['Tamil Nadu', 'Chennai'], ['Telangana', 'Hyderabad'], ['Tripura', 'Agartala'],
  ['Uttar Pradesh', 'Lucknow'], ['Uttarakhand', 'Dehradun'], ['West Bengal', 'Kolkata'],
];

const brands = ['Taj', 'ITC Grand', 'The Oberoi'];
const image = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
const amenities = ['Free WiFi', 'Restaurant', 'Swimming Pool', 'Fitness Center', 'Room Service'];
const roomTypes = [
  { type: 'Standard', basePrice: 4500, totalRooms: 20, availableRooms: 20, bedType: 'Queen', maxOccupancy: 2, size: 320 },
  { type: 'Deluxe', basePrice: 7500, totalRooms: 15, availableRooms: 15, bedType: 'King', maxOccupancy: 2, size: 420 },
  { type: 'Suite', basePrice: 14000, totalRooms: 8, availableRooms: 8, bedType: 'King', maxOccupancy: 3, size: 650 },
];

async function addIndianHotels() {
  await mongoose.connect(process.env.MONGO_URI);
  const hotels = [];

  for (const [state, city] of states) {
    for (const brand of brands) {
      hotels.push({
        name: `${brand} ${city}`,
        location: { city, address: `Central ${city}, ${state}`, country: 'India' },
        description: `A celebrated ${brand} stay in ${city}, offering refined hospitality and easy access to the best of ${state}.`,
        images: [image],
        amenities,
        rating: { average: 4.5, count: 120 },
        starCategory: 5,
        policies: { checkIn: '14:00', checkOut: '11:00', cancellation: 'Free cancellation up to 24 hours before check-in' },
      });
    }
  }

  const existingNames = new Set((await Hotel.find({ name: { $in: hotels.map((hotel) => hotel.name) } }).select('name').lean()).map((hotel) => hotel.name));
  const newHotels = hotels.filter((hotel) => !existingNames.has(hotel.name));
  const insertedHotels = await Hotel.insertMany(newHotels);
  const rooms = insertedHotels.flatMap((hotel) => roomTypes.map((room) => ({
    hotelId: hotel._id,
    ...room,
    amenities: ['Air Conditioning', 'Flat Screen TV', 'Free WiFi', 'Room Service'],
    images: [image],
    description: `Comfortable ${room.type} room at ${hotel.name}.`,
  })));
  await Room.insertMany(rooms);

  console.log(`Added ${insertedHotels.length} hotels and ${rooms.length} rooms across ${states.length} Indian states.`);
  await mongoose.disconnect();
}

addIndianHotels().catch((error) => {
  console.error('Failed to add Indian hotels:', error);
  process.exitCode = 1;
});
