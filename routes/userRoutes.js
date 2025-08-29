const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const bookingRouter = require('./bookingRoutes');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/confirm-email/:token', authController.confirmEmail);
router.post('/login', authController.login);
router.post('/resend-confirmation', authController.resendConfirmEmail);

// Protect all routes after this middleware
router.use(authController.protect);

router.get('/logout', authController.logout);

router.patch('/MyPassword', authController.updatePassword);

router.get('/Me', userController.getMe, userController.getUser);

router.patch(
  '/Me',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

router.delete('/Me', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.use('/:userId/bookings', bookingRouter);

module.exports = router;
