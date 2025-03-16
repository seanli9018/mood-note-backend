const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'this route has not implemented yet.',
  });
});

exports.getUser = catchAsync(async (_req, res, _next) => {
  res.status(200).json({
    status: 'success',
    message: 'this route has not implemented yet.',
  });
});

exports.createUser = catchAsync(async (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'this route has not implemented yet.',
  });
});

exports.updateUser = catchAsync(async (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'this route has not implemented yet.',
  });
});

exports.deleteUser = catchAsync(async (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'this route has not implemented yet.',
  });
});
