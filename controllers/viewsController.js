const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');
const User = require('../models/userModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get tour data from collection
  const tours = await Tour.find();
  //2) Build template

  //3) Render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      fields: 'review rating user',
    })
    .populate({
      path: 'guides',
      fields: 'name photo role',
    });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2) Check if user has booked this tour (for showing review form)
  let hasBooked = false;
  let userReview = null;

  if (res.locals.user) {
    console.log('User ID:', res.locals.user.id); // ДОДАТИ ДЛЯ ДЕБАГУ
    console.log('Tour ID:', tour._id); // ДОДАТИ ДЛЯ ДЕБАГУ
    const booking = await Booking.findOne({
      user: res.locals.user.id,
      tour: tour.id,
    });
    // Check if user already reviewed this tour
    if (booking) {
      console.log('Booking found, ID:', booking.id);
      hasBooked = true;

      // Check if user already reviewed this tour
      userReview = await Review.findOne({
        user: res.locals.user.id,
        tour: tour.id,
      });
    } else {
      console.log('No booking found for this user and tour');
      hasBooked = false;
    }
  }

  // 3) Build template
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    hasBooked,
    userReview,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyReviews = catchAsync(async (req, res, next) => {
  // 1) Find all reviews by current user
  const reviews = await Review.find({ user: req.user.id }).populate({
    path: 'tour',
    select: 'name slug imageCover',

    match: { active: { $ne: false } },
  });
  const validReviews = reviews.filter((review) => review.tour !== null);

  res.status(200).render('account', {
    title: 'My Reviews',
    reviews: validReviews,
    currentPage: 'reviews',
  });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.confirmEmailPage = catchAsync(async (req, res, next) => {
  try {
    // Викликаємо API для підтвердження email
    const response = await axios({
      method: 'GET',
      url: `${req.protocol}://${req.get('host')}/api/v1/users/confirm-email/${req.params.token}`,
    });

    res.status(200).render('confirmEmail', {
      title: 'Email Confirmed',
      status: 'success',
      message: response.data.message,
    });
  } catch (error) {
    res.status(400).render('confirmEmail', {
      title: 'Email Confirmation Failed',
      status: 'error',
      message: error.response?.data?.message || 'Email confirmation failed',
    });
  }
});

exports.getForgotPasswordForm = (req, res) => {
  res.status(200).render('forgotPassword', {
    title: 'Forgot Password',
  });
};

exports.getResetPasswordForm = (req, res) => {
  res.status(200).render('resetPassword', {
    title: 'Reset Password',
    token: req.params.token,
  });
};

// Admin routes - всі використовують account.pug
exports.getAdminTours = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Admin - Manage Tours',
    currentPage: 'admin-tours',
  });
});

exports.getAdminUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-__v -password');

  res.status(200).render('account', {
    title: 'Admin - Manage Users',
    currentPage: 'admin-users',
    users,
  });
});

exports.getAdminReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find().populate('user tour');

  res.status(200).render('account', {
    title: 'Admin - Manage Reviews',
    currentPage: 'admin-reviews',
    reviews,
  });
});

exports.getAdminBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find().populate('user tour');

  res.status(200).render('account', {
    title: 'Admin - Manage Bookings',
    currentPage: 'admin-bookings',
    bookings,
  });
});
