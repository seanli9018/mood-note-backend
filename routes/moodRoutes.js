const express = require('express');
const moodController = require('../controllers/moodController');
const authController = require('../controllers/authController');

// Set merge parameters to true for getting any user related data (userId) in the path (request parameters)
// POST /user/sdfsdxcv234/moods
// GET /user/sdfsdf234/moods
// GET /user/sdfsdf2e3/moods/sdfsdf234234
const router = express.Router({ mergeParams: true });

// =====================Below this point, all routes are protected, need user authentication.=====================
router.use(authController.protect);

router.route('/last-7-days').get(moodController.myLast7DaysMoods);
router
  .route('/getMyMoods')
  .get(moodController.getMyMoods, moodController.getAllMoods);
router
  .route('/createMyMood')
  .post(
    authController.restrictTo('user', 'member'),
    moodController.uploadMoodImages,
    moodController.resizeMoodImages,
    moodController.createMyMood,
    moodController.createMood
  );

router
  .route('/')
  .get(
    moodController.setInitialFilter, // for any user/admin, set userId from path (request params) to req.initialFilter, if no userId in the path but its an admin, send all moods.
    moodController.getAllMoods
  )
  .post(
    authController.restrictTo('user', 'member'), // Only users are able to create mood.
    moodController.uploadMoodImages,
    moodController.resizeMoodImages,
    moodController.setUserId, // for nested user/mood, get userId from path (request params) and set to req.body.
    moodController.createMood
  );

router
  .route('/:id')
  .get(moodController.getMood)
  .patch(
    moodController.uploadMoodImages,
    moodController.resizeMoodImages,
    moodController.updateMood
  )
  .delete(moodController.deleteMood);

module.exports = router;
