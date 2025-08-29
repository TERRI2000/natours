class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Operational errors are those that we expect to happen and can handle gracefully

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
