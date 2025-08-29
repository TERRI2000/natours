const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview,
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/login', viewsController.getLoginForm);

router.get('/signup', viewsController.getSignupForm);

router.get('/forgot-password', viewsController.getForgotPasswordForm);
router.get('/reset-password/:token', viewsController.getResetPasswordForm);

router.get('/confirm-email/:token', viewsController.confirmEmailPage);

router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-reviews', authController.protect, viewsController.getMyReviews);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.use(
  '/admin',
  authController.protect,
  authController.restrictTo('admin'),
);

router.get('/admin/tours', viewsController.getAdminTours);
router.get('/admin/users', viewsController.getAdminUsers);
router.get('/admin/reviews', viewsController.getAdminReviews);
router.get('/admin/bookings', viewsController.getAdminBookings);
module.exports = router;
