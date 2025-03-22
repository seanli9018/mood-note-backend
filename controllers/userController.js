const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const controllerFactory = require('./controllerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((field) => {
    if (allowedFields.includes(field)) {
      newObj[field] = obj[field];
    }
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route if not for password updating. Please use /updateMyPassword',
        400
      )
    );
  }

  //2. Filter req obj: ONLY update certain allowed fields: for example role, _id is not allowed.
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3. Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, _next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = controllerFactory.getAll(User);

exports.getUser = controllerFactory.getOne(User);

// We will not implement create user NOT even for admin.
exports.createUser = catchAsync(async (_req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Please use sign up instead.',
  });
});

// DO NOT update password with this controller.
exports.updateUser = controllerFactory.updateOne(User);

exports.deleteUser = controllerFactory.deleteOne(User);
