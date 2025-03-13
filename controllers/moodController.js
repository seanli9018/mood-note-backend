const Mood = require('../models/moodModel');
const APIFeatures = require('../utils/apiFeatures');
const { moodLevelToName } = require('../utils/moodMapper');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllMoods = catchAsync(async (req, res) => {
  const features = new APIFeatures(Mood.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  const moods = await features.query;

  res.status(200).json({
    status: 'success',
    results: moods.length,
    data: { moods },
  });
});

exports.getMood = catchAsync(async (req, res, next) => {
  const moodId = req.params.id;
  // findById is a wrapper function based on Tour.findOne({_id: moodId})
  const mood = await Mood.findById(moodId);

  if (!mood) {
    // if moodId is not returning data, throw 404 error to global error handler.
    return next(new AppError('No mood found with the id provided', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { mood },
  });
});

exports.createMood = catchAsync(async (req, res) => {
  // Getting data from body object of the post request.
  const newMood = await Mood.create(req.body);

  // Created
  res.status(201).json({
    status: 'success',
    data: {
      mood: newMood,
    },
  });
});

exports.updateMood = catchAsync(async (req, res) => {
  const moodId = req.params.id;
  const updatedMood = await Mood.findByIdAndUpdate(moodId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedMood) {
    // if moodId is not returning data, throw 404 error to global error handler.
    return next(new AppError('No mood found with the id provided', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      mood: updatedMood,
    },
  });
});

exports.deleteMood = catchAsync(async (req, res) => {
  const moodId = req.params.id;
  await Mood.findByIdAndDelete(moodId);
  res.status(204).json({
    status: 'success',
    data: {
      mood: null,
    },
  });
});

// TODO: might want to add aggregation controller for calculating daily/weekly mood average
exports.last7DaysMoods = catchAsync(async (_req, res) => {
  const last7DaysMoods = await Mood.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, // Group by day, Extract YYYY-MM-DD
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
  const response = last7DaysMoods.map((date) => ({
    ...date,
    name: moodLevelToName(date.moodLevelAvg), // Add the mapped name
  }));

  res.status(200).json({
    status: 'success',
    data: { last7DaysMoods: response },
  });
});
