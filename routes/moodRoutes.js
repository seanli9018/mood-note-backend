const express = require('express');
const moodController = require('../controllers/moodController');

const router = express.Router();

router.route('/last-7-days').get(moodController.last7DaysMoods);

router
  .route('/')
  .get(moodController.getAllMoods)
  .post(moodController.createMood);

router
  .route('/:id')
  .get(moodController.getMood)
  .patch(moodController.updateMood)
  .delete(moodController.deleteMood);

module.exports = router;
