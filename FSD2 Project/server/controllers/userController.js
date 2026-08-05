const asyncHandler = require('express-async-handler');
const mongoose     = require('mongoose');
const User         = require('../models/User');
const Course       = require('../models/Course');
const Material     = require('../models/Material');
const Submission   = require('../models/Submission');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ═══════════════════════════════════════════════════════════════════════════
 * getUsers
 * @desc    Admin: get paginated list of users with search and role filter
 * @route   GET /api/users
 * @access  Private – Admin only
 * ═══════════════════════════════════════════════════════════════════════════ */
const getUsers = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page, 10)  || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.role && ['admin', 'faculty', 'student'].includes(req.query.role)) {
    filter.role = req.query.role;
  }
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    users,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * updateUserRole
 * @desc    Admin: update a user's role
 * @route   PUT /api/users/:id/role
 * @access  Private – Admin only
 * ═══════════════════════════════════════════════════════════════════════════ */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id }   = req.params;
  const { role } = req.body;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid user ID'); }
  if (!['admin', 'faculty', 'student'].includes(role)) {
    res.status(400); throw new Error('Invalid role specified');
  }

  // Prevent admin from changing their own role to lower privilege
  if (id === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot change your own admin role');
  }

  const user = await User.findById(id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    user,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * toggleUserStatus
 * @desc    Admin: activate or deactivate a user account
 * @route   PUT /api/users/:id/status
 * @access  Private – Admin only
 * ═══════════════════════════════════════════════════════════════════════════ */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid user ID'); }

  if (id === req.user._id.toString()) {
    res.status(400); throw new Error('You cannot deactivate your own admin account');
  }

  const user = await User.findById(id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User account ${user.isActive ? 'activated' : 'deactivated'}`,
    user,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getAdminStats
 * @desc    Admin: system-wide statistical summary
 * @route   GET /api/users/stats
 * @access  Private – Admin only
 * ═══════════════════════════════════════════════════════════════════════════ */
const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalFaculty,
    totalAdmins,
    totalCourses,
    publishedCourses,
    totalMaterials,
    totalSubmissions,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    User.countDocuments({ role: 'admin' }),
    Course.countDocuments({}),
    Course.countDocuments({ isPublished: true }),
    Material.countDocuments({}),
    Submission.countDocuments({}),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalUsers: totalStudents + totalFaculty + totalAdmins,
      totalCourses,
      publishedCourses,
      totalMaterials,
      totalSubmissions,
    },
  });
});

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getAdminStats,
};
