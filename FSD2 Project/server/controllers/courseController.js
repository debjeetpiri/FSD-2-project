const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: resolve a stored file path into a full public URL.
 * Converts Windows back-slashes to forward-slashes for URL safety.
 * ───────────────────────────────────────────────────────────────────────────── */
const toPublicUrl = (req, filePath) => {
  if (!filePath) return '';
  const clean = filePath.replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/${clean}`;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: validate a MongoDB ObjectId string.
 * ───────────────────────────────────────────────────────────────────────────── */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ═══════════════════════════════════════════════════════════════════════════
 * createCourse
 * @desc    Create a new course (cover image optional via prior Multer pass)
 * @route   POST /api/courses
 * @access  Private – Admin | Faculty
 * ═══════════════════════════════════════════════════════════════════════════ */
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, duration, level, isPublished } = req.body;

  // ── Input validation ───────────────────────────────────────────────────────
  if (!title || title.trim().length < 3) {
    res.status(400);
    throw new Error('Title is required and must be at least 3 characters');
  }
  if (!description || description.trim().length < 10) {
    res.status(400);
    throw new Error('Description is required and must be at least 10 characters');
  }

  const validCategories = [
    'Programming', 'Design', 'Business', 'Science',
    'Mathematics', 'Language', 'Arts', 'Other',
  ];
  if (!category || !validCategories.includes(category)) {
    res.status(400);
    throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
  }

  // ── Determine faculty owner ────────────────────────────────────────────────
  // Admins may specify a facultyId in the body; faculty defaults to themselves.
  let facultyId = req.user._id;
  if (req.user.role === 'admin' && req.body.facultyId) {
    if (!isValidObjectId(req.body.facultyId)) {
      res.status(400);
      throw new Error('Invalid facultyId');
    }
    facultyId = req.body.facultyId;
  }

  // ── Resolve cover image path (set by uploadThumbnail middleware, if used) ──
  const coverImage = req.file
    ? req.file.path.replace(/\\/g, '/')
    : '';

  const course = await Course.create({
    title:       title.trim(),
    description: description.trim(),
    category,
    faculty:     facultyId,
    coverImage,
    duration:    duration   ? duration.trim()           : '',
    level:       level      ? level                     : 'Beginner',
    isPublished: isPublished === 'true' || isPublished === true,
  });

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getCourses
 * @desc    List all published courses with optional search / filter / pagination
 * @route   GET /api/courses
 * @access  Public
 *
 * Query params:
 *   search   – full-text search on title + description
 *   category – filter by category enum value
 *   level    – filter by level (Beginner | Intermediate | Advanced)
 *   faculty  – filter by faculty ObjectId
 *   page     – page number (default 1)
 *   limit    – results per page (default 10, max 50)
 * ═══════════════════════════════════════════════════════════════════════════ */
const getCourses = asyncHandler(async (req, res) => {
  const { search, category, level, faculty, page = 1, limit = 10 } = req.query;

  // ── Build filter object ────────────────────────────────────────────────────
  const filter = { isPublished: true };

  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }
  if (category) filter.category = category;
  if (level)    filter.level    = level;
  if (faculty && isValidObjectId(faculty)) filter.faculty = faculty;

  // ── Pagination math ────────────────────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page, 10))  || 1;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10))) || 10;
  const skip     = (pageNum - 1) * limitNum;

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('faculty', 'name email profileImage')
      .select('-enrolledStudents')          // keep list response lean
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Course.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page:       pageNum,
    totalPages: Math.ceil(total / limitNum),
    count:      courses.length,
    courses,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getCourseById
 * @desc    Get a single course with populated faculty, materials, and assignments
 * @route   GET /api/courses/:id
 * @access  Public (published) | Private (unpublished – faculty owner / admin)
 * ═══════════════════════════════════════════════════════════════════════════ */
const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid course ID');
  }

  const course = await Course.findById(id)
    .populate('faculty',          'name email profileImage')
    .populate('enrolledStudents', 'name email profileImage');

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // ── Visibility gate ────────────────────────────────────────────────────────
  // Unpublished courses are visible only to their faculty owner and admins
  if (!course.isPublished) {
    const isOwner =
      req.user &&
      (req.user.role === 'admin' ||
        course.faculty._id.toString() === req.user._id.toString());

    if (!isOwner) {
      res.status(403);
      throw new Error('This course is not yet published');
    }
  }

  // ── Fetch related materials and assignments in parallel ───────────────────
  const [materials, assignments] = await Promise.all([
    Material.find({ course: id, isVisible: true })
      .populate('uploadedBy', 'name')
      .sort({ order: 1, createdAt: 1 }),
    Assignment.find({ course: id, isActive: true })
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 }),
  ]);

  res.status(200).json({
    success: true,
    course,
    materials,
    assignments,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * updateCourse
 * @desc    Update course details (thumbnail handled by uploadThumbnail middleware)
 * @route   PUT /api/courses/:id
 * @access  Private – Admin | Faculty owner only
 * ═══════════════════════════════════════════════════════════════════════════ */
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid course ID');
  }

  const course = await Course.findById(id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // ── Ownership check (admins bypass) ───────────────────────────────────────
  if (
    req.user.role !== 'admin' &&
    course.faculty.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('You are not authorized to edit this course');
  }

  const { title, description, category, duration, level, isPublished } = req.body;

  if (title !== undefined)       course.title       = title.trim();
  if (description !== undefined) course.description = description.trim();
  if (category !== undefined)    course.category    = category;
  if (duration !== undefined)    course.duration    = duration.trim();
  if (level !== undefined)       course.level       = level;
  if (isPublished !== undefined) {
    course.isPublished = isPublished === 'true' || isPublished === true;
  }

  // Update cover image if a new file was uploaded
  if (req.file) {
    course.coverImage = req.file.path.replace(/\\/g, '/');
  }

  const updated = await course.save();

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    course: updated,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * deleteCourse
 * @desc    Hard-delete a course and its associated materials & assignments
 * @route   DELETE /api/courses/:id
 * @access  Private – Admin | Faculty owner only
 * ═══════════════════════════════════════════════════════════════════════════ */
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid course ID');
  }

  const course = await Course.findById(id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (
    req.user.role !== 'admin' &&
    course.faculty.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('You are not authorized to delete this course');
  }

  // Cascade-delete related materials and assignments
  await Promise.all([
    Material.deleteMany({ course: id }),
    Assignment.deleteMany({ course: id }),
    Course.findByIdAndDelete(id),
  ]);

  res.status(200).json({
    success: true,
    message: 'Course and all associated content deleted successfully',
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * enrollCourse
 * @desc    Enroll the currently logged-in student in a course
 * @route   POST /api/courses/:id/enroll
 * @access  Private – Student only
 * ═══════════════════════════════════════════════════════════════════════════ */
const enrollCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid course ID');
  }

  const course = await Course.findById(id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (!course.isPublished) {
    res.status(400);
    throw new Error('Cannot enroll in an unpublished course');
  }

  const studentId = req.user._id;

  // ── Prevent duplicate enrolment ────────────────────────────────────────────
  const alreadyEnrolled = course.enrolledStudents.some(
    (sid) => sid.toString() === studentId.toString()
  );
  if (alreadyEnrolled) {
    res.status(400);
    throw new Error('You are already enrolled in this course');
  }

  // ── $addToSet is idempotent at the DB level (extra safety net) ────────────
  const updated = await Course.findByIdAndUpdate(
    id,
    { $addToSet: { enrolledStudents: studentId } },
    { new: true }
  ).populate('faculty', 'name email');

  res.status(200).json({
    success: true,
    message: `Successfully enrolled in "${updated.title}"`,
    enrollmentCount: updated.enrolledStudents.length,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * unenrollCourse
 * @desc    Remove the current student from a course's enrolled list
 * @route   DELETE /api/courses/:id/enroll
 * @access  Private – Student only
 * ═══════════════════════════════════════════════════════════════════════════ */
const unenrollCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid course ID');
  }

  const course = await Course.findById(id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const studentId = req.user._id;
  const isEnrolled = course.enrolledStudents.some(
    (sid) => sid.toString() === studentId.toString()
  );

  if (!isEnrolled) {
    res.status(400);
    throw new Error('You are not enrolled in this course');
  }

  await Course.findByIdAndUpdate(id, {
    $pull: { enrolledStudents: studentId },
  });

  res.status(200).json({
    success: true,
    message: `Successfully unenrolled from "${course.title}"`,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getMyCourses
 * @desc    Faculty: returns courses they own.
 *          Student: returns courses they are enrolled in.
 * @route   GET /api/courses/my
 * @access  Private – All authenticated roles
 * ═══════════════════════════════════════════════════════════════════════════ */
const getMyCourses = asyncHandler(async (req, res) => {
  let courses;

  if (req.user.role === 'faculty') {
    courses = await Course.find({ faculty: req.user._id })
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });
  } else if (req.user.role === 'student') {
    courses = await Course.find({ enrolledStudents: req.user._id, isPublished: true })
      .populate('faculty', 'name email')
      .select('-enrolledStudents')
      .sort({ createdAt: -1 });
  } else {
    // Admin – return all courses
    courses = await Course.find()
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    count: courses.length,
    courses,
  });
});

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  getMyCourses,
};
