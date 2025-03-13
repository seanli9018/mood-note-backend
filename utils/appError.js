class AppError extends Error {
  constructor(message, statusCode) {
    // Build Error class Only accepts error message.
    // Set message property by calling parent built-in Error class.
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // All AppError instance are operational, which means all errors/exceptions are predictable.
    // unlike programming error/syntax error.
    this.operational = true;

    // To exclude this constructor to be appear in the error stack.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
