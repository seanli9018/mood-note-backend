const crypto = require('crypto');
const mongoose = require('mongoose');
const validators = require('../utils/validators');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowercase: true,
    validate: [validators.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'member', 'admin', 'super-admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide your password!'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      // This only works on .save or .create!!! NO UPDATE validation.
      validator: function (pwdConfirm) {
        return pwdConfirm === this.password;
      },
      message: 'Password and confirmed password are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Handles password encryption/hash before saving.
userSchema.pre('save', async function (next) {
  // Only run this pre-save hook if the password was actually modified.
  if (!this.isModified('password')) return next();

  // Password hashing: increase the more gpu intensive level to 12 for nowadays computer.
  this.password = await bcrypt.hash(this.password, 12);

  // Remove passwordConfirm field after validation.
  this.passwordConfirm = undefined;
  next();
});

// Handles password reset to auto update passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // Small hack: here to avoid the jwt token generated before the passwordChangedAt.
  this.passwordChangedAt = Date.now() - 2000;
  next();
});

// Instance method to check if its correct password again bcrypted db password.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if the password has been changed after a certain timestamp.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // formatting db field passwordChangedAt from a date --> timestamp in milliseconds --> timestamp in seconds
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp; // return true if the changedTimestamp is after JWTTimestamp.
  }

  return false;
};

// Instance method to create password reset token.
userSchema.methods.createPasswordResetToken = function () {
  // Use build-in crypto util to create a hex 32 bytes token.
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Store encrypted token in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // expires in 10min.
  this.passwordResetExpires =
    Date.now() + process.env.PASSWORD_RESET_EXPIRES_IN * 60 * 1000;

  // send un-encrypted token to client email. but store encrypted version in DB.
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
