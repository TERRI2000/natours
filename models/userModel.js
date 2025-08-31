const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'A user must have a name'],
    maxlength: [40, 'A user name must have less or equal than 40 characters'],
    minlength: [4, 'A user name must have more or equal than 4 characters'],
  },
  email: {
    type: String,
    trim: true,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  emailConfirmToken: String,
  emailConfirmExpires: Date,
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: [8, 'A password must have more or equal than 8 characters'],
    select: false, // this will not be returned in queries
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password; // this only works on CREATE and SAVE
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  if (!this.password) {
    return next(new AppError('Password is required for hashing', 400));
  }
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined; // remove passwordConfirm field after hashing
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // subtract 1 second to make sure the JWT is created after this date
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp; // true means changed
  }
  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');


  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken; // this is the plain token to send to the user
};

userSchema.methods.createEmailConfirmToken = function () {
  const confirmToken = crypto.randomBytes(32).toString('hex');

  this.emailConfirmToken = crypto
    .createHash('sha256')
    .update(confirmToken)
    .digest('hex');

  this.emailConfirmExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return confirmToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
