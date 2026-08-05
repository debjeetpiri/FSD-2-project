const asyncHandler  = require('express-async-handler');
const mongoose      = require('mongoose');
const Assignment    = require('../models/Assignment');
const Course        = require('../models/Course');
const Submission    = require('../models/Submission');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ─── helpers ────────────────────────────────────────────────────────────── */
const isFacultyOwnerOrAdmin = (course, user) =>
  user.role === 'admin' ||
  course.faculty.toString() === user._id.toString();

const isEnrolled = (course, userId) =>
  course.enrolledStudents.some((s) => s.toString() === userId.toString());

/* ═══════════════════════════════════════════════════════════════════════════
 * createAssignment
 * @route   POST /api/assignments
 * @access  Private – Admin | Faculty (owner of the course)
 * ═══════════════════════════════════════════════════════════════════════════ */
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, dueDate, courseId, maxScore, attachmentUrl } = req.body;

  // ── Validation ─────────────────────────────────────────────────────────
  if (!title || title.trim().length < 3) {
    res.status(400); throw new Error('Title must be at least 3 characters');
  }
  if (!description || description.trim().length < 10) {
    res.status(400); throw new Error('Description must be at least 10 characters');
  }
  if (!dueDate) {
    res.status(400); throw new Error('Due date is required');
  }
  if (new Date(dueDate) <= Date.now()) {
    res.status(400); throw new Error('Due date must be a future date');
  }
  if (!courseId || !isValidId(courseId)) {
    res.status(400); throw new Error('A valid courseId is required');
  }

  // ── Course ownership check ──────────────────────────────────────────────
  const course = await Course.findById(courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }

  if (!isFacultyOwnerOrAdmin(course, req.user)) {
    res.status(403);
    throw new Error('You are not authorized to create assignments for this course');
  }

  const assignment = await Assignment.create({
    title:         title.trim(),
    description:   description.trim(),
    dueDate:       new Date(dueDate),
    course:        courseId,
    createdBy:     req.user._id,
    maxScore:      maxScore ? parseInt(maxScore, 10) : 100,
    attachmentUrl: attachmentUrl ? attachmentUrl.trim() : '',
  });

  const populated = await assignment.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    assignment: populated,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getCourseAssignments
 * @desc    List all active assignments for a course
 * @route   GET /api/assignments/course/:courseId
 * @access  Private – Admin | Faculty owner | Enrolled Student
 * ═══════════════════════════════════════════════════════════════════════════ */
const getCourseAssignments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!isValidId(courseId)) {
    res.status(400); throw new Error('Invalid course ID');
  }

  const course = await Course.findById(courseId);
  if (!course) { res.status(404); throw new Error('Course not found'); }

  const privileged = isFacultyOwnerOrAdmin(course, req.user);
  const enrolled   = req.user.role === 'student' && isEnrolled(course, req.user._id);

  if (!privileged && !enrolled) {
    res.status(403);
    throw new Error('Access denied. You must be enrolled in this course.');
  }

  const filter = { course: courseId };
  // Students only see active assignments; faculty/admin see all
  if (!privileged) filter.isActive = true;

  const assignments = await Assignment.find(filter)
    .populate('createdBy', 'name')
    .sort({ dueDate: 1 });

  // For each assignment attach this student's submission status (if student)
  let result = assignments;
  if (req.user.role === 'student') {
    const submissions = await Submission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      student:    req.user._id,
    }).select('assignment status score');

    const subMap = {};
    submissions.forEach((s) => { subMap[s.assignment.toString()] = s; });

    result = assignments.map((a) => {
      const obj = a.toObject();
      obj.mySubmission = subMap[a._id.toString()] || null;
      return obj;
    });
  }

  res.status(200).json({ success: true, count: result.length, assignments: result });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getAssignmentById
 * @route   GET /api/assignments/:id
 * @access  Private – Admin | Faculty owner | Enrolled Student
 * ═══════════════════════════════════════════════════════════════════════════ */
const getAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid assignment ID'); }

  const assignment = await Assignment.findById(id)
    .populate('createdBy', 'name email')
    .populate('course',    'title faculty enrolledStudents');

  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  const course = assignment.course;
  const privileged = isFacultyOwnerOrAdmin(course, req.user);
  const enrolled   = req.user.role === 'student' && isEnrolled(course, req.user._id);

  if (!privileged && !enrolled) {
    res.status(403); throw new Error('Access denied.');
  }

  // Attach the student's own submission if they are a student
  let mySubmission = null;
  if (req.user.role === 'student') {
    mySubmission = await Submission.findOne({
      assignment: id,
      student:    req.user._id,
    });
  }

  res.status(200).json({ success: true, assignment, mySubmission });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * updateAssignment
 * @route   PUT /api/assignments/:id
 * @access  Private – Admin | Faculty owner
 * ═══════════════════════════════════════════════════════════════════════════ */
const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid assignment ID'); }

  const assignment = await Assignment.findById(id).populate('course', 'faculty');
  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  if (!isFacultyOwnerOrAdmin(assignment.course, req.user)) {
    res.status(403); throw new Error('Not authorized to edit this assignment');
  }

  const { title, description, dueDate, maxScore, isActive, attachmentUrl } = req.body;

  if (title !== undefined)         assignment.title         = title.trim();
  if (description !== undefined)   assignment.description   = description.trim();
  if (dueDate !== undefined)       assignment.dueDate       = new Date(dueDate);
  if (maxScore !== undefined)      assignment.maxScore      = parseInt(maxScore, 10);
  if (isActive !== undefined)      assignment.isActive      = isActive === true || isActive === 'true';
  if (attachmentUrl !== undefined) assignment.attachmentUrl = attachmentUrl.trim();

  const updated = await assignment.save();

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully',
    assignment: updated,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * deleteAssignment
 * @route   DELETE /api/assignments/:id
 * @access  Private – Admin | Faculty owner
 * ═══════════════════════════════════════════════════════════════════════════ */
const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) { res.status(400); throw new Error('Invalid assignment ID'); }

  const assignment = await Assignment.findById(id).populate('course', 'faculty');
  if (!assignment) { res.status(404); throw new Error('Assignment not found'); }

  if (!isFacultyOwnerOrAdmin(assignment.course, req.user)) {
    res.status(403); throw new Error('Not authorized to delete this assignment');
  }

  // Cascade-delete all submissions for this assignment
  await Promise.all([
    Submission.deleteMany({ assignment: id }),
    Assignment.findByIdAndDelete(id),
  ]);

  res.status(200).json({
    success: true,
    message: 'Assignment and all its submissions deleted',
  });
});

module.exports = {
  createAssignment,
  getCourseAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
