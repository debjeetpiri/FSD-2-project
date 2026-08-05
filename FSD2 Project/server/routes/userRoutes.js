const express = require('express');
const router  = express.Router();

const {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getAdminStats,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All user management routes require logged-in Admin access
router.use(protect, authorize('admin'));

/**
 * @route   GET /api/users/stats
 * @desc    Platform-wide aggregate statistics
 */
router.get('/stats', getAdminStats);

/**
 * @route   GET /api/users
 * @desc    Get paginated user list with optional role/search filters
 */
router.get('/', getUsers);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update a user's role (admin | faculty | student)
 */
router.put('/:id/role', updateUserRole);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Toggle user account status (active/deactive)
 */
router.put('/:id/status', toggleUserStatus);

module.exports = router;
