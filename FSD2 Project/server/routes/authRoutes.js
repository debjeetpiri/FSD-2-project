const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

/* ─────────────────────────────────────────────────────────────────────────────
 * Public Routes (no JWT required)
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   POST /api/auth/register
 * @desc    Create a new student or faculty account
 * @access  Public
 * @body    { name, email, password, role? }
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return signed JWT
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', loginUser);

/* ─────────────────────────────────────────────────────────────────────────────
 * Protected Routes (valid JWT required via `protect` middleware)
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   GET  /api/auth/me
 * @desc    Fetch the current user's profile
 * @access  Private
 */
router.get('/me', protect, getUserProfile);

/**
 * @route   PUT  /api/auth/me
 * @desc    Update name or profile image of the current user
 * @access  Private
 * @body    { name?, profileImage? }
 */
router.put('/me', protect, updateUserProfile);

/**
 * @route   PUT  /api/auth/change-password
 * @desc    Change the current user's password (rotates JWT)
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/change-password', protect, changePassword);

module.exports = router;
