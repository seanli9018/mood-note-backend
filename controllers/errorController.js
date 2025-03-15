const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicatedErrorDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((errItem) => errItem.message);
  const message = `Invalid input data. ${errors.join('; ')}`;
  return new AppError(message, 400);
};

// send error while in development env.
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// send error while in production env.
const sendErrorProd = (err, res) => {
  // Only send operational/trusted error to client.
  if (err.operational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // For all other errors, such as third-party package error or programming/syntax error, don't leak error details.
  console.error('Error', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};

// Global error handler: err always as the first params, and it will receive errors from all parts of the App that invoke next(err)
module.exports = (err, _req, res, _next) => {
  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let error = JSON.parse(JSON.stringify(err));

    // Convert mongoose errors to operational error with user friendly msg.
    // example: _id: random_string which is not compliant with mongo DB ObjectId.
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // duplicated fields, if certain field must be unique.
    if (error.code === 11000) error = handleDuplicatedErrorDB(error);
    // field validation errors.
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};
