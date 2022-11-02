const express = require('express');
const {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
} = require('../controllers/authController');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} = require('../controllers/userController');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/login').post(login);

router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').patch(resetPassword);

// PROTECTED ROUTES
// Implements protect middleware for all following routes instead of needing to pass in protect in all of them individually
router.use(protect);

router.route('/updateMyPassword').patch(updatePassword);
router.route('/me').get(getMe, getUser);
router.route('/updateMe').patch(updateMe);
router.route('/deleteMe').delete(deleteMe);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
