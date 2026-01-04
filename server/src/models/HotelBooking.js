const mongoose = require('mongoose');

const hotelBookingSchema = new mongoose.Schema({
  // Link to the trip
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  
  // Link to the user (optional for guest bookings)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest bookings
  },
  
  // Hotel details (snapshot at time of booking)
  hotelDetails: {
    id: String,
    name: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    rating: Number,
    amenities: [String],
    address: String,
    coordinates: {
      lat: Number,
      lon: Number
    },
    description: String,
    image: String
  },
  
  // Guest information
  guestDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: String,
    phone: String
  },
  
  // Booking metadata
  bookingConfirmationId: {
    type: String,
    required: true,
    unique: true
  },
  
  confirmationCode: String,
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed'
  },
  
  // Dates
  checkIn: Date,
  checkOut: Date,
  numberOfNights: Number,
  
  // Total cost
  totalCost: Number,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
hotelBookingSchema.index({ trip: 1, user: 1 });
// Note: bookingConfirmationId already has an index via unique: true

const HotelBooking = mongoose.model('HotelBooking', hotelBookingSchema);

module.exports = HotelBooking;
