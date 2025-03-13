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

module.exports = (err, _req, res, _next) => {
  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};
