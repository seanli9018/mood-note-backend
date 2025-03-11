const Mood = require('../models/moodModel');
const APIFeatures = require('../utils/apiFeatures');
const moodMapper = require('../utils/moodMapper');

exports.getAllMoods = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getMood = async (req, res) => {
  const moodId = req.params.id;
  try {
    // findById is a wrapper function based on Tour.findOne({_id: moodId})
    const mood = await Mood.findById(moodId);

    res.status(200).json({
      status: 'success',
      data: { mood },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createMood = async (req, res) => {
  try {
    console.log(req);
    // Getting data from body object of the post request.
    const newMood = await Mood.create(req.body);

    // Created
    res.status(201).json({
      status: 'success',
      data: {
        mood: newMood,
      },
    });
  } catch (err) {
    // Bad request
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateMood = async (req, res) => {
  const moodId = req.params.id;
  try {
    const updatedMood = await Mood.findByIdAndUpdate(moodId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        mood: updatedMood,
      },
    });
  } catch (err) {
    // Bad request
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteMood = async (req, res) => {
  const moodId = req.params.id;
  try {
    await Mood.findByIdAndDelete(moodId);
    res.status(204).json({
      status: 'success',
      data: {
        mood: null,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

// TODO: might want to add aggregation controller for calculating daily/weekly mood average
exports.last7DaysMoods = async (_req, res) => {
  try {
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
      name: moodMapper(date.moodLevelAvg), // Add the mapped name
    }));

    res.status(200).json({
      status: 'success',
      data: { last7DaysMoods: response },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err,
    });
  }
};
