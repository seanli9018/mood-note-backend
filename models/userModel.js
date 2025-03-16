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

const User = mongoose.model('User', userSchema);

module.exports = User;
