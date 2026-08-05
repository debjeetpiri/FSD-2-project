const asyncHandler = require('express-async-handler');
const mongoose     = require('mongoose');
const Submission   = require('../models/Submission');
const Assignment   = require('../models/Assignment');
const Course       = require('../models/Course');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isFacultyOwnerOrAdmin = (course, user) =>
  user.role === 'admin' ||
  course.faculty.toString() === user._id.toString();

/* ═══════════════════════════════════════════════════════════════════════════
 * submitAssignment
 * @desc    Student uploads their submission file for an assignment.
 *          File is handled by uploadNote Multer middleware (PDF/doc, ≤20 MB)
 *          mounted on the route before this controller.
 * @route   POST /api/submissions
 * @access  Private – Student only
 * ═══════════════════════════════════════════════════════════════════════════ */
const submitAssignment = asyncHandler(async (req, res) => {
  const { assignmentId } = req.body;

  if (!assignmentId || !isValidId(assignmentId)) {
    res.status(400); throw new Error('A valid assignmentId is required');
  }
  if (!req.file) {
    res.status(400); throw new Error('No file uploaded. Please attach your submission file.');
  }

  // ── Fetch assignment + course for validation ────────────────────────────
  const assignment = await Assignment.findById(assignmentId).populate(
    'course', 'enrolledStudents faculty'
  );

  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }
  if (!assignment.isActive) {
    res.status(400); throw new Error('This assignment is no longer accepting submissions');
  }

  // ── Student must be enrolled in the course ──────────────────────────────
  const course = assignment.course;
  const enrolled = course.enrolledStudents.some(
    (s) => s.toString() === req.user._id.toString()
  );
  if (!enrolled) {
    res.status(403);
    throw new Error('You must be enrolled in this course to submit an assignment');
  }

  // ── Duplicate submission guard (unique index is the DB safety net) ───────
  const existing = await Submission.findOne({
    assignment: assignmentId,
    student:    req.user._id,
  });
  if (existing) {
    res.status(400);
    throw new Error('You have already submitted this assignment. Delete your previous submission to resubmit.');
  }

  // ── Detect late submission ──────────────────────────────────────────────
  const isLate = new Date() > new Date(assignment.dueDate);

  const fileUrl = req.file.path.replace(/\\/g, '/');

  const submission = await Submission.create({
    assignment:  assignmentId,
    student:     req.user._id,
    fileUrl,
    isLate,
    submittedAt: new Date(),
  });

  const populated = await submission.populate('student', 'name email');

  res.status(201).json({
    success: true,
    message: isLate
      ? 'Submission received (marked as late — past the due date)'
      : 'Assignment submitted successfully',
    submission: populated,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getAssignmentSubmissions
 * @desc    Faculty/Admin: list all submissions for an assignment with stats.
 * @route   GET /api/submissions/assignment/:assignmentId
 * @access  Private – Admin | Faculty owner
 * ═══════════════════════════════════════════════════════════════════════════ */
const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  if (!isValidId(assignmentId)) {
    res.status(400); throw new Error('Invalid assignment ID');
  }

  const assignment = await Assignment.findById(assignmentId).populate(
    'course', 'faculty title'
  );
  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  if (!isFacultyOwnerOrAdmin(assignment.course, req.user)) {
    res.status(403); throw new Error('Access denied');
  }

  const submissions = await Submission.find({ assignment: assignmentId })
    .populate('student', 'name email profileImage')
    .populate('gradedBy', 'name')
    .sort({ submittedAt: 1 });

  // Quick stats
  const total   = submissions.length;
  const graded  = submissions.filter((s) => s.status === 'graded').length;
  const late    = submissions.filter((s) => s.isLate).length;
  const avgScore = graded
    ? Math.round(
        submissions
          .filter((s) => s.score !== null)
          .reduce((acc, s) => acc + s.score, 0) / graded
      )
    : null;

  res.status(200).json({
    success: true,
    stats:   { total, graded, pending: total - graded, late, avgScore },
    submissions,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getMySubmissions
 * @desc    Student: list all their own submissions (with populated assignment)
 * @route   GET /api/submissions/my
 * @access  Private – Student
 * ═══════════════════════════════════════════════════════════════════════════ */
const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ student: req.user._id })
    .populate({
      path:     'assignment',
      select:   'title dueDate maxScore course isActive',
      populate: { path: 'course', select: 'title' },
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getSubmissionById
 * @route   GET /api/submissions/:id
 * @access  Private – Admin | Faculty owner | Owning Student
 * ═══════════════════════════════════════════════════════════════════════════ */
const getSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid submission ID'); }

  const submission = await Submission.findById(id)
    .populate('student',    'name email profileImage')
    .populate('gradedBy',   'name')
    .populate({
      path:     'assignment',
      populate: { path: 'course', select: 'title faculty' },
    });

  if (!submission) { res.status(404); throw new Error('Submission not found'); }

  const { user } = req;
  const course   = submission.assignment.course;
  const isOwner  = submission.student._id.toString() === user._id.toString();
  const privil   = isFacultyOwnerOrAdmin(course, user);

  if (!isOwner && !privil) {
    res.status(403); throw new Error('Access denied');
  }

  res.status(200).json({ success: true, submission });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * gradeSubmission
 * @desc    Faculty/Admin: set score, feedback, and mark as graded/returned.
 * @route   PUT /api/submissions/:id/grade
 * @access  Private – Admin | Faculty owner
 * ═══════════════════════════════════════════════════════════════════════════ */
const gradeSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score, feedback, status } = req.body;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid submission ID'); }

  const submission = await Submission.findById(id).populate({
    path:     'assignment',
    populate: { path: 'course', select: 'faculty' },
  });

  if (!submission) { res.status(404); throw new Error('Submission not found'); }

  const course = submission.assignment.course;
  if (!isFacultyOwnerOrAdmin(course, req.user)) {
    res.status(403); throw new Error('Not authorized to grade this submission');
  }

  // Validate score against assignment's maxScore
  if (score !== undefined) {
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0) {
      res.status(400); throw new Error('Score must be a non-negative number');
    }
    if (numScore > submission.assignment.maxScore) {
      res.status(400);
      throw new Error(`Score cannot exceed maxScore (${submission.assignment.maxScore})`);
    }
    submission.score = numScore;
  }

  if (feedback !== undefined) submission.feedback = feedback.trim();

  const validStatuses = ['graded', 'returned'];
  if (status && validStatuses.includes(status)) {
    submission.status   = status;
    submission.gradedBy = req.user._id;
  } else {
    // Default to 'graded' when score is set for the first time
    if (score !== undefined && submission.status === 'submitted') {
      submission.status   = 'graded';
      submission.gradedBy = req.user._id;
    }
  }

  const updated = await submission.save();

  res.status(200).json({
    success: true,
    message: 'Submission graded successfully',
    submission: updated,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * deleteSubmission
 * @desc    Student can retract an un-graded submission; Admin can delete any.
 * @route   DELETE /api/submissions/:id
 * @access  Private – Student (own, ungraded) | Admin
 * ═══════════════════════════════════════════════════════════════════════════ */
const deleteSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid submission ID'); }

  const submission = await Submission.findById(id);
  if (!submission) { res.status(404); throw new Error('Submission not found'); }

  const isOwner = submission.student.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403); throw new Error('Not authorized to delete this submission');
  }
  if (isOwner && !isAdmin && submission.status !== 'submitted') {
    res.status(400);
    throw new Error('Cannot retract a submission that has already been graded');
  }

  await Submission.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: 'Submission deleted successfully' });
});

module.exports = {
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
  getSubmissionById,
  gradeSubmission,
  deleteSubmission,
};
