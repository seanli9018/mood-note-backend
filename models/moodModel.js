const mongoose = require('mongoose');
const { moodNameToLevel } = require('../utils/moodMapper');

// Define mongoose mood schema.
const moodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A mood is required.'],
    enum: {
      values: [
        'satisfied',
        'very-satisfied',
        'excited',
        'neutral',
        'calm',
        'dissatisfied',
        'bad',
        'stressed',
        'frustrated',
      ],
      message:
        'Mood name should follow the pre-defined set: satisfied, neutral, stressed, etc.',
    },
  },
  note: {
    type: String,
    required: [true, 'Mood note is required.'],
    trim: true,
    maxlength: [1000, 'Mood note must have less or equal then 1000 characters'],
    minlength: [10, 'Mood note must have more than or equal to 10 characters.'],
  },
  level: {
    type: Number,
    min: [0, 'Mood level must be above or equal to 0'],
    max: [100, 'Mood level must be below or equal to 100'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  images: [String],
  // TODO: user field with userId need to be implemented here.
});

// Mongoose Document Middleware: runs before .save() and .create()
moodSchema.pre('save', function (next) {
  if (this.level) return;
  // if no level field provided, assigning default level based on the mood name field.
  this.level = moodNameToLevel(this.name);
  next();
});

// Mongoose Query Middleware: to measure query performance.
moodSchema.pre(/^find/, function (next) {
  // adding a variable to the query object.
  this.start = Date.now();
  next();
});
moodSchema.post(/^find/, function (_docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// Create mood model/table/collection.
const Mood = mongoose.model('Mood', moodSchema);

module.exports = Mood;
