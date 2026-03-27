const express = require('express');
const router = express.Router();
const { getRoomsByHotel } = require('../controllers/roomController');

router.get('/:hotelId', getRoomsByHotel);

module.exports = router;
