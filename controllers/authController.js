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
