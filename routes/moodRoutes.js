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

router.route('/last-7-days').get(moodController.last7DaysMoods);

router
  .route('/')
  .get(
    moodController.setInitialFilter, // for regular user, set userId in path (request params) to req.initialFilter, for admin, check the admin role.
    moodController.getAllMoods
  )
  .post(
    authController.restrictTo('user', 'member'), // Only users are able to create mood.
    moodController.setUserId,
    moodController.createMood
  );

router
  .route('/:id')
  .get(moodController.getMood)
  .patch(moodController.updateMood)
  .delete(moodController.deleteMood);

module.exports = router;
