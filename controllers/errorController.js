const AppError = require('./../utils/appError');

const handleDuplicateFieldsDB = (err) => {
  // Duplicate field error in new version of MongoDB
  // Example: E11000 duplicate key error collection: tours.tours index: name_ 1 dup key: { name: "Tour Name" }
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      error: err,
      message: err.message || 'Internal Server Error',
      stack: err.stack,
    });
  }
  // RENDERED WEBSITE
  return res.status(err.statusCode || 500).render('error', {
    title: 'Something went wrong!',
    msg: err.message || 'Please try again later.',
  });
};

const sendErrorProd = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  const msg = err.isOperational
    ? err.message
    : 'this is unexpected -- please contact support';
  if (!err.isOperational) console.error('error 🥵', err);

  if (req.originalUrl.startsWith('/api')) {
    res.status(statusCode).json({
      status,
      message: msg,
    });
  } else {
    res.status(statusCode).render('error', {
      title: 'Something went wrong',
      msg,
    });
  }
};

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = Object.create(Object.getPrototypeOf(err));
    // Object.assign(error, err);
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.statusCode = err.statusCode;
    error.status = err.status;
    error.isOperational = err.isOperational;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
