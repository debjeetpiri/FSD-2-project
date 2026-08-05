const express = require('express');
const router  = express.Router();

const {
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
  getSubmissionById,
  gradeSubmission,
  deleteSubmission,
} = require('../controllers/submissionController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadNote }          = require('../middleware/uploadMiddleware');

/**
 * @route   POST /api/submissions
 * @desc    Student submits a file for an assignment (PDF/doc ≤ 20 MB)
 * @access  Private – Student
 * @body    { assignmentId }  +  file field: "file"
 */
router.post(
  '/',
  protect,
  authorize('student'),
  uploadNote,
  submitAssignment
);

/**
 * @route   GET /api/submissions/my
 * @desc    Student retrieves all their own submissions
 * @access  Private – Student
 * NOTE: Must be above /:id to prevent "my" being matched as an ObjectId
 */
router.get('/my', protect, authorize('student'), getMySubmissions);

/**
 * @route   GET /api/submissions/assignment/:assignmentId
 * @desc    Faculty/Admin: get all submissions for an assignment with stats
 * @access  Private – Admin | Faculty
 */
router.get(
  '/assignment/:assignmentId',
  protect,
  authorize('admin', 'faculty'),
  getAssignmentSubmissions
);

/**
 * @route   GET /api/submissions/:id
 * @desc    Get a single submission (student = own only; faculty/admin = any)
 * @access  Private – Admin | Faculty owner | Owning Student
 */
router.get('/:id', protect, getSubmissionById);

/**
 * @route   PUT /api/submissions/:id/grade
 * @desc    Grade a submission: set score, feedback, and status
 * @access  Private – Admin | Faculty owner
 * @body    { score, feedback?, status? }
 */
router.put(
  '/:id/grade',
  protect,
  authorize('admin', 'faculty'),
  gradeSubmission
);

/**
 * @route   DELETE /api/submissions/:id
 * @desc    Student retracts an ungraded submission | Admin deletes any
 * @access  Private – Student (own, ungraded) | Admin
 */
router.delete('/:id', protect, deleteSubmission);

module.exports = router;
