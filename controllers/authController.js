const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, _next) => {
  // NOTE: DO NOT take the whole req.body object directly, only take what we need to create a user.
  // So that no one can pass role: admin within req.body.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // sign jwt token
  const token = signToken(newUser._id);

  // log in the user by sending the token to client while sign up. (localStorage approach)
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check email and password exist
  if (!email || !password) {
    return next(
      new AppError('Email and password are required for logging in.', 400)
    );
  }

  // 2. check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');

  // the correctPassword method is defined in userModal as instance method (a function thats attached to user instance)
  // to follow the FAT Model THIN Controller practice.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  // 3. if everything ok, send token to client.
  // sign jwt token
  const token = signToken(user._id);

  // No need to send back user data for logging in. Token is enough.
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Getting token and check if its there.
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.'),
      401
    );
  }

  // 2. Validate the token. if its a invalid or expired token, the error is handled within errorController.js in PROD block. its handled globally.
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. Check if user exits.
  const user = await User.findById(decodedPayload.id);
  if (!user) {
    return next(new AppError('The user no longer exist.', 401));
  }

  // 4. Check if user changed password after the JWT was issues.
  if (user.changedPasswordAfter(decodedPayload.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // 5. pass user related data to next controller via request object.
  req.user = user;

  // ACCESS GRANTED.
  next();
});

exports.restrictTo = (...roles) => {
  return (req, _res, next) => {
    // roles: ['super-admin', 'admin']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
