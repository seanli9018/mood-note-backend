const Mood = require('../models/moodModel');

exports.getAllMoods = async (req, res) => {
  try {
    // Filtering
    const queryObj = { ...req.query };
    const excludedQueries = ['page', 'sort', 'limit', 'fields'];
    excludedQueries.forEach((excludedItem) => delete queryObj[excludedItem]);

    // Advanced filtering: gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Mood.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      // 'level -createdAt'
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // Default sorting by: createdAt descending.
      query = query.sort('-createdAt');
    }

    // Fields limiting
    if (req.query.fields) {
      // 'name level note'
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // Default fields limiting to exclude __v field
      query = query.select('-__v');
    }

    // Execute query
    const moods = await query;

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
