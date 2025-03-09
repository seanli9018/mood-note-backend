const mongoose = require('mongoose');

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

// Create mood model/table/collection.
const Mood = mongoose.model('Mood', moodSchema);

module.exports = Mood;
