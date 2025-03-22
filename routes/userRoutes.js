const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const moodRouter = require('./moodRoutes');

const router = express.Router();

// Mounting mood router under user router, then it will reroute to mood router.
// POST (create mood under a user resource): /api/v1/users/434sd23fsda/moods
// GET (get all moods that belong to a user resource): /api/v1/users/434sd23fsda/moods
// GET (get a mood that belongs to a user resource): /api/v1/users/434sd23fsda/moods/1234edfsolcsd
router.use('/:userId/moods', moodRouter);

// User self service.
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// =====================Below this point, all routes are protected, need user authentication.=====================
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get(
  '/me',
  userController.getMe, // Passing logged in user's userId from req.user to path (request parameters).
  userController.getUser
);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// =====================Below this point, all routes are Admin Only.=====================
router.use(authController.restrictTo('super-admin', 'admin'));

// Standard CRUD for admin.
router.route('/').get(userController.getAllUsers).post(
  userController.createUser // This createUser will always returning 500, No admins can create user. Regular user will need to use signup instead.
);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
