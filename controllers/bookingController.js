const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handleFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  // 2) Create checkout session
  const paypalOrder = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: req.params.tourId,
        description: `${tour.name} Tour - ${tour.summary}`,
        amount: {
          currency_code: 'USD',
          value: tour.price.toFixed(2), // ⭐ Ensure 2 decimal places
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: tour.price.toFixed(2),
            },
          },
        },
        items: [
          {
            name: tour.name,
            description: tour.summary,
            quantity: '1',
            category: 'DIGITAL_GOODS',
            unit_amount: {
              currency_code: 'USD',
              value: tour.price.toFixed(2),
            },
          },
        ],
      },
    ],
    application_context: {
      return_url: `${req.protocol}://${req.get('host')}/?tours=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      brand_name: 'Natours',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
    },
  };

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    paypalOrder,
    paypalClientId: process.env.PAYPAL_CLIENT_ID, // Додаємо Client ID для frontend
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await factory.createOne('Booking')({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBookingFromPayPal = catchAsync(async (req, res, next) => {
  const { paypalOrderId, tourId, tourDateId } = req.body;

  if (!paypalOrderId || !tourId || !tourDateId) {
    return next(
      new AppError(
        'PayPal Order ID, Tour ID, and Tour Date ID are required',
        400,
      ),
    );
  }

  if (!req.user || !req.user.id) {
    return next(new AppError('You must be logged in to make a booking', 401));
  }

  const existingBooking = await Booking.findOne({ paypalOrderId });

  if (existingBooking) {
    return res.status(200).json({
      status: 'success',
      message: 'Booking already exists',
      data: {
        booking: existingBooking,
      },
    });
  }

  // Get tour and check date availability
  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError('Tour not found', 404));
  }

  if (!tour.isDateAvailable(tourDateId)) {
    return next(
      new AppError('Selected tour date is not available or sold out', 400),
    );
  }

  // Check if user already booked this tour
  const userTourBooking = await Booking.findOne({
    user: req.user.id,
    tour: tourId,
  });

  if (userTourBooking) {
    return next(new AppError('You have already booked this tour!', 400));
  }

  // Create booking record
  const booking = await Booking.create({
    tour: tourId,
    tourDate: tourDateId,
    user: req.user.id,
    price: tour.price,
    paypalOrderId,
    paid: true,
  });

  // Update tour date participants
  await tour.bookDate(tourDateId);

  res.status(201).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

exports.checkIfBooked = catchAsync(async (req, res, next) => {
  // To check if booked was bought by user who wants to review it
  const booking = await Booking.find({
    user: req.user.id,
    tour: req.body.tour,
  });
  if (booking.length === 0)
    return next(new AppError('You must buy this tour to review it', 401));
  next();
});

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user && req.user) req.body.user = req.user.id;
  next();
};

exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = catchAsync(async (req, res, next) => {
  let filter = {};

  // Handle nested routes
  if (req.params.tourId) filter.tour = req.params.tourId;
  if (req.params.userId) filter.user = req.params.userId;

  const features = new APIFeatures(Booking.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookings = await features.query;

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      booking: bookings,
    },
  });
});
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
