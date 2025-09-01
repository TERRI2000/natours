const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // true for HTTPS
    httpOnly: true, // prevents client-side JavaScript from accessing the cookie
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // Remove password from output

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    emailConfirmed: false, // Set to false until email is confirmed
  });

  // Generate email confirmation token
  const confirmToken = newUser.createEmailConfirmToken();
  await newUser.save({ validateBeforeSave: false });

  try {
    const confirmURL = `${req.protocol}://${req.get('host')}/api/v1/users/confirm-email/${confirmToken}`;

    await new Email(newUser, confirmURL).sendEmailConfirmation();

    res.status(201).json({
      status: 'success',
      message:
        'User registered! Please check your email to confirm your account.',
    });
  } catch (err) {
    newUser.emailConfirmToken = undefined;
    newUser.emailConfirmExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailConfirmToken: hashedToken,
    emailConfirmExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.redirect(
      '/?alert=error:Invalid or expired confirmation link. Please try again or request a new confirmation email.',
    );
  }

  // Confirm email
  user.emailConfirmed = true;
  user.emailConfirmToken = undefined;
  user.emailConfirmExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.redirect(
    '/?alert=success:Email confirmed successfully! You can now book tours.',
  );
});
exports.requireEmailConfirmed = (req, res, next) => {
  if (!req.user.emailConfirmed) {
    return next(
      new AppError(
        'Please confirm your email address to access this feature. Check your inbox for confirmation link.',
        403,
      ),
    );
  }
  next();
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) If everything is ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }
  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // 1) Verify token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET,
    );

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // There is a logged in user
    res.locals.user = currentUser;
  }
  next();
});

exports.logout = (req, res) => {
  // Очищуємо cookie з правильними опціями
  res.clearCookie('jwt', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  

  res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array, e.g. ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('We send email if this user exists.', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  createSendToken(user, 200, req,res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  if (!req.body.password || !req.body.passwordConfirm) {
    return next(
      new AppError('Please provide password and passwordConfirm', 400),
    );
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will not work as intended because it does not run the pre('save') middleware

  // 4) Log user in, send JWT

  createSendToken(user, 200, req, res);
});

exports.resendConfirmEmail = catchAsync(async (req, res, next) => {

  // 1) Знайти користувача за email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user found with that email address.', 404));
  }

  // 2) Перевірити чи email вже підтверджено
  if (user.emailConfirmed) {
    return next(new AppError('Your email is already confirmed.', 400));
  }

  // 3) Створити новий токен підтвердження
  const confirmToken = user.createEmailConfirmToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 4) Відправити новий email
    const confirmURL = `${req.protocol}://${req.get('host')}/api/v1/users/confirm-email/${confirmToken}`;

    await new Email(user, confirmURL).sendEmailConfirmation();

    res.status(200).json({
      status: 'success',
      message: 'Confirmation email sent to your email address!',
    });
  } catch (err) {

    // Очищуємо токени при помилці
    user.emailConfirmToken = undefined;
    user.emailConfirmExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500,
      ),
    );
  }
});
