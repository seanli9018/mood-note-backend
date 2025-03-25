const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const controllerFactory = require('./controllerFactory');
const multer = require('multer');
const sharp = require('sharp');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((field) => {
    if (allowedFields.includes(field)) {
      newObj[field] = obj[field];
    }
  });

  return newObj;
};

const multerStorage = multer.memoryStorage();

const multerFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not a image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage, // save image in memory buffer. (No save to disk)
  filter: multerFilter, // check if it is the correct file type.
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  // use sharp to cut image and covert to jpeg
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

exports.getMe = (req, _res, next) => {
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

  // 2. Filter req obj: ONLY update certain allowed fields: for example role, _id is not allowed.
  // image file can NOT be passed via req.body, instead it will be passed via req.file.
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Save image filename to photo field, since we only save filename in DB instead of the actual image.
  if (req.file) filteredBody.photo = req.file.filename;

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
