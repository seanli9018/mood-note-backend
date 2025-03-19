const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //90 days.
    ),
    httpOnly: true,
  };
  // turn on https cookie for PROD env.
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password field before sending data back to client.
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
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

  createSendToken(newUser, 201, res);
});

// TODO: limit maximum number of login, after 5 failed attempts, need to lock the user.
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
  createSendToken(user, 200, res);
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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on posted email.
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with the email address', 404));
  }

  // 2. Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. send reset password url to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. 
  \n if you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email, Try again later!',
        500
      )
    );
  }

  // DO NOT send reset token here, to keep it safe, ONLY send the token to user email within the resetURL.
  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and there is user, set the new password.
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }
  user.password = req.body.password;
  // This password confirm will be used to compare to the password in the userModel validator.
  // And it will be removed in the userModel pre-save hook once the validation is completed.
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt property for the user.
  // Update changedPasswordAt field in the userModel pre-save automatically.

  // 4. Log the user in, send JWT.
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2. Check if POSTed current password is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.currentPassword, user.password))
  ) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 3. If so, update password
  user.password = req.body.password;
  // This password confirm will be used to compare to the password in the userModel validator.
  // And it will be removed in the userModel pre-save hook once the validation is completed.
  user.passwordConfirm = req.body.passwordConfirm;
  // DO NOT use findOneAndUpdate, since password and confirmPassword comparison and pre-save hook will NOT work.
  await user.save();

  // 4. log user in, send JWT back to client
  createSendToken(user, 200, res);
});
