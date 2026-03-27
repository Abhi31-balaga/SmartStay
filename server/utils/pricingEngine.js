/**
 * SmartStay Dynamic Pricing Engine
 * Calculates room prices based on demand, availability, seasonality, and time factors
 */

const Booking = require('../models/Booking');

/**
 * Determines the season multiplier based on the month
 * @param {Date} date
 * @returns {number} multiplier
 */
const getSeasonMultiplier = (date) => {
  const month = new Date(date).getMonth() + 1; // 1-12

  // Peak seasons: Dec-Jan (winter holidays), Apr-Jun (summer), Oct (Diwali season)
  const peakMonths = [12, 1, 4, 5, 6, 10];
  // High demand months
  const highMonths = [2, 3, 11];
  // Low season: July-Sep (monsoon in India)
  const lowMonths = [7, 8, 9];

  if (peakMonths.includes(month)) return 1.3;
  if (highMonths.includes(month)) return 1.15;
  if (lowMonths.includes(month)) return 0.85;
  return 1.0;
};

/**
 * Checks if the date is a weekend (Fri-Sun)
 * @param {Date} date
 * @returns {boolean}
 */
const isWeekend = (date) => {
  const day = new Date(date).getDay(); // 0=Sun, 6=Sat, 5=Fri
  return day === 0 || day === 5 || day === 6;
};

/**
 * Core Dynamic Pricing Calculation
 * @param {Object} room - Room document from DB
 * @param {Date} date - Date for which to calculate price
 * @param {number} activeBookings - Number of active/upcoming bookings for this room
 * @returns {Object} priceDetails
 */
const calculateDynamicPrice = (room, date, activeBookings = 0) => {
  const basePrice = room.basePrice;
  const totalRooms = room.totalRooms;
  const availableRooms = room.availableRooms;

  // --- 1. Demand Factor ---
  // More bookings = higher demand charge (max +20% of base price)
  const occupancyRate = totalRooms > 0 ? (totalRooms - availableRooms) / totalRooms : 0;
  const demandFactor = Math.min(occupancyRate, 1); // 0-1
  const demandCharge = Math.round(basePrice * demandFactor * 0.2);

  // --- 2. Availability Discount ---
  // More rooms available = slight discount to attract bookings
  let availabilityDiscount = 0;
  if (availableRooms > totalRooms * 0.7) {
    // >70% available => 10% discount
    availabilityDiscount = Math.round(basePrice * 0.1);
  } else if (availableRooms <= 2 && availableRooms > 0) {
    // Last 2 rooms => urgency premium +15%
    availabilityDiscount = -Math.round(basePrice * 0.15); // negative = added charge
  }

  // --- 3. Weekend Charge ---
  const weekendCharge = isWeekend(date) ? Math.round(basePrice * 0.15) : 0;

  // --- 4. Seasonal Multiplier ---
  const seasonMultiplier = getSeasonMultiplier(date);
  const seasonCharge = Math.round(basePrice * (seasonMultiplier - 1));

  // --- 5. Last-Minute Booking Discount (booking for today/tomorrow) ---
  const daysUntilCheckIn = Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  let lastMinuteDiscount = 0;
  if (daysUntilCheckIn <= 1 && availableRooms > 3) {
    lastMinuteDiscount = Math.round(basePrice * 0.08);
  }

  // --- 6. Early Bird Discount (booking 30+ days in advance) ---
  let earlyBirdDiscount = 0;
  if (daysUntilCheckIn >= 30 && availableRooms > totalRooms * 0.5) {
    earlyBirdDiscount = Math.round(basePrice * 0.05);
  }

  // Calculate final price
  const finalPrice = Math.max(
    Math.round(
      basePrice +
        demandCharge +
        weekendCharge +
        seasonCharge -
        availabilityDiscount -
        lastMinuteDiscount -
        earlyBirdDiscount
    ),
    Math.round(basePrice * 0.7) // minimum 70% of base price
  );

  return {
    basePrice,
    finalPrice,
    breakdown: {
      basePrice,
      demandCharge,
      weekendCharge,
      seasonCharge,
      availabilityDiscount: availabilityDiscount + lastMinuteDiscount + earlyBirdDiscount,
      isWeekend: isWeekend(date),
      season: getSeasonLabel(date),
      occupancyRate: Math.round(occupancyRate * 100),
      availableRooms,
      totalRooms,
    },
    tags: getPriceTags(demandFactor, availableRooms, totalRooms, date),
  };
};

/**
 * Get human-readable season label
 */
const getSeasonLabel = (date) => {
  const month = new Date(date).getMonth() + 1;
  const peakMonths = [12, 1, 4, 5, 6, 10];
  const lowMonths = [7, 8, 9];
  if (peakMonths.includes(month)) return 'Peak Season';
  if (lowMonths.includes(month)) return 'Low Season';
  return 'Regular Season';
};

/**
 * Generate price tags/badges for UI display
 */
const getPriceTags = (demandFactor, availableRooms, totalRooms, date) => {
  const tags = [];
  if (availableRooms <= 2 && availableRooms > 0) tags.push({ label: `Only ${availableRooms} left!`, type: 'urgent' });
  if (demandFactor > 0.7) tags.push({ label: 'High Demand', type: 'warning' });
  if (isWeekend(date)) tags.push({ label: 'Weekend Rate', type: 'info' });
  const month = new Date(date).getMonth() + 1;
  if ([12, 1, 4, 5, 6, 10].includes(month)) tags.push({ label: 'Peak Season', type: 'peak' });
  if ([7, 8, 9].includes(month)) tags.push({ label: 'Off-Season Deal', type: 'deal' });
  return tags;
};

/**
 * Calculate total booking price for multiple nights
 * @param {Object} room
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {number} activeBookings
 */
const calculateBookingTotal = (room, checkIn, checkOut, activeBookings = 0) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  let totalPrice = 0;
  const nightly = [];

  for (let i = 0; i < nights; i++) {
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + i);
    const pricing = calculateDynamicPrice(room, date, activeBookings);
    totalPrice += pricing.finalPrice;
    nightly.push({ date: date.toISOString().split('T')[0], price: pricing.finalPrice });
  }

  return {
    nights,
    totalPrice,
    avgNightlyRate: Math.round(totalPrice / nights),
    nightlyBreakdown: nightly,
    priceBreakdown: calculateDynamicPrice(room, checkInDate, activeBookings).breakdown,
  };
};

module.exports = { calculateDynamicPrice, calculateBookingTotal, getSeasonLabel };
