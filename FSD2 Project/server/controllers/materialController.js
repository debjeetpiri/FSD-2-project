const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Material = require('../models/Material');
const Course = require('../models/Course');

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: validate a MongoDB ObjectId string.
 * ───────────────────────────────────────────────────────────────────────────── */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: check if a student is enrolled in a course.
 * ───────────────────────────────────────────────────────────────────────────── */
const isEnrolled = (course, userId) =>
  course.enrolledStudents.some((sid) => sid.toString() === userId.toString());

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: check if a user owns / is the faculty of a course, or is an admin.
 * ───────────────────────────────────────────────────────────────────────────── */
const isFacultyOwnerOrAdmin = (course, user) =>
  user.role === 'admin' ||
  course.faculty.toString() === user._id.toString();

/* ═══════════════════════════════════════════════════════════════════════════
 * uploadMaterial
 * @desc    Upload a PDF note or video and attach it to a course.
 *          The actual Multer file parsing is performed by uploadNote / uploadVideo
 *          middleware that runs BEFORE this controller in the route chain.
 *          `req.file` is populated by Multer at this point.
 * @route   POST /api/materials
 * @access  Private – Admin | Faculty (owner of the course)
 * ═══════════════════════════════════════════════════════════════════════════ */
const uploadMaterial = asyncHandler(async (req, res) => {
  const { title, description, courseId, type, order } = req.body;

  // ── 1. Field presence validation ───────────────────────────────────────────
  if (!title || title.trim().length < 3) {
    res.status(400);
    throw new Error('Title is required and must be at least 3 characters');
  }

  const validTypes = ['note', 'video'];
  if (!type || !validTypes.includes(type)) {
    res.status(400);
    throw new Error('Type must be either "note" or "video"');
  }

  if (!courseId || !isValidObjectId(courseId)) {
    res.status(400);
    throw new Error('A valid courseId is required');
  }

  // ── 2. Confirm the file was actually uploaded ──────────────────────────────
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Please attach a file to this request.');
  }

  // ── 3. Verify the course exists ────────────────────────────────────────────
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // ── 4. Ownership check – only the faculty owner or admin may add materials ─
  if (!isFacultyOwnerOrAdmin(course, req.user)) {
    res.status(403);
    throw new Error('You are not authorized to add materials to this course');
  }

  // ── 5. Build the file path stored in the DB ────────────────────────────────
  //       Normalise back-slashes to forward-slashes for cross-platform safety
  const fileUrl = req.file.path.replace(/\\/g, '/');

  // ── 6. Persist the material document ─────────────────────────────────────
  const material = await Material.create({
    title:       title.trim(),
    type,
    fileUrl,
    description: description ? description.trim() : '',
    course:      courseId,
    uploadedBy:  req.user._id,
    order:       order !== undefined ? parseInt(order, 10) : 0,
  });

  // ── 7. Respond with the populated material ────────────────────────────────
  const populated = await material.populate('uploadedBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Material uploaded successfully',
    material: populated,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getCourseMaterials
 * @desc    List all visible materials for a course.
 *          Access rules:
 *            • Admin           → always allowed
 *            • Faculty owner   → always allowed (sees all, incl. hidden)
 *            • Enrolled student → sees only isVisible=true materials
 *            • Others          → 403
 * @route   GET /api/materials/course/:courseId
 * @access  Private – Admin | Faculty owner | Enrolled Student
 * ═══════════════════════════════════════════════════════════════════════════ */
const getCourseMaterials = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!isValidObjectId(courseId)) {
    res.status(400);
    throw new Error('Invalid course ID');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const user = req.user;
  const isPrivileged = isFacultyOwnerOrAdmin(course, user);
  const studentEnrolled =
    user.role === 'student' && isEnrolled(course, user._id);

  if (!isPrivileged && !studentEnrolled) {
    res.status(403);
    throw new Error(
      'Access denied. You must be enrolled in this course to view its materials.'
    );
  }

  // Faculty/Admin see everything; students see only visible materials
  const filter = { course: courseId };
  if (!isPrivileged) filter.isVisible = true;

  const materials = await Material.find(filter)
    .populate('uploadedBy', 'name email profileImage')
    .sort({ order: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    count: materials.length,
    materials,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * getMaterialById
 * @desc    Fetch a single material document
 * @route   GET /api/materials/:id
 * @access  Private – Admin | Faculty owner | Enrolled Student
 * ═══════════════════════════════════════════════════════════════════════════ */
const getMaterialById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid material ID');
  }

  const material = await Material.findById(id)
    .populate('uploadedBy', 'name email')
    .populate('course', 'title faculty enrolledStudents isPublished');

  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }

  const course = material.course;
  const user   = req.user;
  const isPrivileged = isFacultyOwnerOrAdmin(course, user);
  const studentEnrolled =
    user.role === 'student' && isEnrolled(course, user._id);

  if (!isPrivileged && !studentEnrolled) {
    res.status(403);
    throw new Error('Access denied. You must be enrolled in this course.');
  }

  // Hidden materials visible only to faculty/admin
  if (!material.isVisible && !isPrivileged) {
    res.status(403);
    throw new Error('This material is currently hidden');
  }

  res.status(200).json({ success: true, material });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * updateMaterial
 * @desc    Update material metadata (title, description, visibility, order).
 *          File replacement is NOT supported here – delete and re-upload instead.
 * @route   PUT /api/materials/:id
 * @access  Private – Admin | Faculty owner
 * ═══════════════════════════════════════════════════════════════════════════ */
const updateMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid material ID');
  }

  const material = await Material.findById(id).populate('course', 'faculty');
  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }

  if (!isFacultyOwnerOrAdmin(material.course, req.user)) {
    res.status(403);
    throw new Error('You are not authorized to edit this material');
  }

  const { title, description, isVisible, order } = req.body;

  if (title !== undefined)       material.title       = title.trim();
  if (description !== undefined) material.description = description.trim();
  if (isVisible !== undefined)   material.isVisible   = isVisible === 'true' || isVisible === true;
  if (order !== undefined)       material.order       = parseInt(order, 10);

  const updated = await material.save();

  res.status(200).json({
    success: true,
    message: 'Material updated successfully',
    material: updated,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * deleteMaterial
 * @desc    Hard-delete a material record.
 *          Note: physical file deletion from disk is intentionally NOT done here
 *          to prevent accidental loss; a separate scheduled cleanup job should
 *          handle orphaned uploads.
 * @route   DELETE /api/materials/:id
 * @access  Private – Admin | Faculty owner
 * ═══════════════════════════════════════════════════════════════════════════ */
const deleteMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid material ID');
  }

  const material = await Material.findById(id).populate('course', 'faculty');
  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }

  if (!isFacultyOwnerOrAdmin(material.course, req.user)) {
    res.status(403);
    throw new Error('You are not authorized to delete this material');
  }

  await Material.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Material deleted successfully',
  });
});

module.exports = {
  uploadMaterial,
  getCourseMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
