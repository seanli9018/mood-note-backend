const Mood = require('../models/moodModel');
const { moodLevelToName } = require('../utils/moodMapper');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const controllerFactory = require('./controllerFactory');
const multer = require('multer');
const sharp = require('sharp');

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

exports.uploadMoodImages = upload.array('images', 3);

exports.resizeMoodImages = catchAsync(async (req, _res, next) => {
  if (!req.files) return next();

  req.body.images = [];

  await Promise.all(
    req.files.map(async (file, index) => {
      const filename = `mood-${req.params.id ?? req.user._id}-${Date.now()}-${
        index + 1
      }.jpeg`;
      // use sharp to cut image and covert to jpeg
      await sharp(file.buffer)
        .resize(2000, 1333) // 3:2 image.
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toFile(`public/img/moods/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// This middleware controller is for regular user: set userId in path (request params) to req.initialFilter, for admin: check the admin role.
exports.setInitialFilter = (req, _res, next) => {
  // if there is NO userId in the path (request params), and the user is not a admin, then return unauthorized error.
  if (!req.params.userId && !req.user.role.includes('admin')) {
    return next(
      new AppError('You do not have permission to perform this action!', 403)
    );
  }

  // if there is a userId in the path (request params), then add a filter to only query all moods belong to the user.
  let initialFilter = {};
  if (req.params.userId) initialFilter = { user: req.params.userId };

  req.initialFilter = initialFilter;

  next();
};

// This middleware controller is for nested route to obtain userId from path (request params), if no userId in req.body.
// For creating mood.
exports.setUserId = (req, _res, next) => {
  // if userId is not in the body, then get it from path (request params)
  if (!req.body.user) req.body.user = req.params?.userId;

  next();
};

exports.getMyMoods = (req, _res, next) => {
  // get userId from req.user._id.
  req.initialFilter = { user: req.user._id };

  next();
};

exports.createMyMood = (req, _res, next) => {
  // get userId from req.user._id.
  req.body.user = req.user._id;

  next();
};

exports.getAllMoods = controllerFactory.getAll(Mood);

exports.getMood = controllerFactory.getOne(Mood);

exports.createMood = controllerFactory.createOne(Mood);

exports.updateMood = controllerFactory.updateOne(Mood);

exports.deleteMood = controllerFactory.deleteOne(Mood);

// TODO: might want to add aggregation controller for calculating daily/weekly mood average
exports.myLast7DaysMoods = catchAsync(async (req, res) => {
  // get the timezone from request (e.g., req.query.timezone)
  const timezone = req.query.timezone || 'UTC'; // Fallback to UTC if not provided

  const getUTCStartOfUser7DaysAgo = (timezone) => {
    const now = new Date();
    const localNow = new Date(
      now.toLocaleString('en-US', { timeZone: timezone })
    );
    localNow.setDate(localNow.getDate() - 6); // last 7 days includes today
    return new Date(localNow.toISOString().split('T')[0]); // UTC midnight
  };

  const startDate = getUTCStartOfUser7DaysAgo(timezone);

  const myLast7DaysMoods = await Mood.aggregate([
    {
      $match: {
        user: req.user._id,
        createdAt: { $gte: startDate },
      },
    },
    {
      $addFields: {
        localDate: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: timezone, // convert UTC to user local time.
          },
        },
      },
    },
    {
      $group: {
        _id: '$localDate',
        moodLevelAvg: { $avg: '$level' }, // Compute average mood
      },
    },
    { $addFields: { date: '$_id' } }, // add a meaning full field name to replace _id.
    {
      $project: {
        _id: 0,
      }, // to remove the _id field.
    },
    { $sort: { date: 1 } }, // Sort by date ascending
  ]);

  // Apply the mood mapper in JavaScript
  const response = myLast7DaysMoods.map((date) => ({
    ...date,
    name: moodLevelToName(date.moodLevelAvg), // Add the mapped name
  }));

  res.status(200).json({
    status: 'success',
    data: { myLast7DaysMoods: response },
  });
});
