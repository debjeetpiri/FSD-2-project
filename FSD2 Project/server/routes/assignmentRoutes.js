const express = require('express');
const router  = express.Router();

const {
  createAssignment,
  getCourseAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');

const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment for a course
 * @access  Private – Admin | Faculty
 * @body    { title, description, dueDate, courseId, maxScore?, attachmentUrl? }
 */
router.post('/', protect, authorize('admin', 'faculty'), createAssignment);

/**
 * @route   GET /api/assignments/course/:courseId
 * @desc    List all assignments for a course (with student's submission status)
 * @access  Private – Admin | Faculty owner | Enrolled Student
 * NOTE: Defined before /:id to avoid route collision
 */
router.get('/course/:courseId', protect, getCourseAssignments);

/**
 * @route   GET /api/assignments/:id
 * @desc    Get a single assignment (+ student's own submission if applicable)
 * @access  Private – Admin | Faculty owner | Enrolled Student
 */
router.get('/:id', protect, getAssignmentById);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment metadata
 * @access  Private – Admin | Faculty owner
 * @body    { title?, description?, dueDate?, maxScore?, isActive?, attachmentUrl? }
 */
router.put('/:id', protect, authorize('admin', 'faculty'), updateAssignment);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment and cascade-delete all its submissions
 * @access  Private – Admin | Faculty owner
 */
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteAssignment);

module.exports = router;
