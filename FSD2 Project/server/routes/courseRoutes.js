const express = require('express');
const router = express.Router();

const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  getMyCourses,
} = require('../controllers/courseController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadThumbnail }     = require('../middleware/uploadMiddleware');

/* ─────────────────────────────────────────────────────────────────────────────
 * Public Routes
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   GET /api/courses
 * @desc    List all published courses (search, filter, paginate via query params)
 * @access  Public
 * @query   search | category | level | faculty | page | limit
 */
router.get('/', getCourses);

/* ─────────────────────────────────────────────────────────────────────────────
 * Protected Routes – all authenticated users
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   GET /api/courses/my
 * @desc    Faculty → own courses | Student → enrolled courses | Admin → all
 * @access  Private
 * NOTE: Defined BEFORE /:id to prevent Express matching "my" as an ObjectId
 */
router.get('/my', protect, getMyCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get a single course with materials and assignments
 * @access  Public (published) | Private (unpublished – faculty owner / admin)
 */
router.get('/:id', getCourseById);

/* ─────────────────────────────────────────────────────────────────────────────
 * Protected Routes – Admin | Faculty only
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   POST /api/courses
 * @desc    Create a new course (optional cover image via multipart/form-data)
 * @access  Private – Admin | Faculty
 * @body    title, description, category, [duration, level, isPublished, facultyId]
 * @file    coverImage (optional image)
 */
router.post(
  '/',
  protect,
  authorize('admin', 'faculty'),
  uploadThumbnail,
  createCourse
);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course details / cover image
 * @access  Private – Admin | Faculty owner
 * @body    title?, description?, category?, duration?, level?, isPublished?
 * @file    coverImage? (optional replacement image)
 */
router.put(
  '/:id',
  protect,
  authorize('admin', 'faculty'),
  uploadThumbnail,
  updateCourse
);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course and cascade-delete its materials & assignments
 * @access  Private – Admin | Faculty owner
 */
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteCourse);

/* ─────────────────────────────────────────────────────────────────────────────
 * Enrolment Routes – Student only
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll the current student in a course
 * @access  Private – Student
 */
router.post('/:id/enroll', protect, authorize('student'), enrollCourse);

/**
 * @route   DELETE /api/courses/:id/enroll
 * @desc    Unenroll the current student from a course
 * @access  Private – Student
 */
router.delete('/:id/enroll', protect, authorize('student'), unenrollCourse);

module.exports = router;
