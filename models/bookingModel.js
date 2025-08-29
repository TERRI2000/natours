const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  tourDate: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Booking must have a tour date'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price!'],
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal'],
    default: 'paypal',
  },
  paypalOrderId: {
    type: String,
    sparse: true, // дозволяє null значення, але робить унікальний індекс
    unique: true, // запобігає дублюванню платежів
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
