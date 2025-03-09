const fs = require('fs');

const moods = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/moods.json`)
);

exports.getAllMoods = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: moods.length,
    data: { moods },
  });
};

exports.getMood = (req, res) => {
  console.log(req.param);
  res.status(200).json({
    status: 'success',
  });
};

exports.createMood = (req, res) => {
  res.status(200).json({
    status: 'success',
  });
};

exports.updateMood = (req, res) => {
  console.log(req.param);
  res.status(200).json({
    status: 'success',
  });
};

exports.deleteMood = (req, res) => {
  console.log(req.param);
  res.status(200).json({
    status: 'success',
  });
};
