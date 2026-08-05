const express = require('express');
const router = express.Router();

const {
  uploadMaterial,
  getCourseMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} = require('../controllers/materialController');

const { protect, authorize }           = require('../middleware/authMiddleware');
const { uploadNote, uploadVideo }       = require('../middleware/uploadMiddleware');

/* ─────────────────────────────────────────────────────────────────────────────
 * Dynamic upload middleware selector
 *
 * Reads `req.body.type` to decide which Multer instance to invoke.
 * Must be positioned AFTER `protect` (so the request is authenticated) but
 * BEFORE the controller (so `req.file` is available).
 *
 * Supported values:
 *   type=note   → uploadNote  (PDFs / documents, 20 MB limit)
 *   type=video  → uploadVideo (MP4 / WebM etc., 500 MB limit)
 *
 * For multipart/form-data, `req.body` is not parsed until Multer runs, so we
 * use a tiny pre-pass middleware that reads the raw Content-Type boundary to
 * detect multipart, then falls back to choosing based on query/body.
 * ───────────────────────────────────────────────────────────────────────────── */
const dynamicUpload = (req, res, next) => {
  // `req.body.type` may not yet be populated if Content-Type is multipart,
  // so we also check the query string as a fallback.
  const materialType = (req.query.type || '').toLowerCase();

  if (materialType === 'video') {
    return uploadVideo(req, res, next);
  }

  // Default to note/document upload
  return uploadNote(req, res, next);
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Routes
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * @route   POST /api/materials?type=note|video
 * @desc    Upload a material (PDF note or video) and attach it to a course.
 *          Send as multipart/form-data.
 *          Include `type` in the query string so the router can choose the
 *          correct Multer instance before body parsing.
 * @access  Private – Admin | Faculty
 * @body    title, courseId, type (note|video), [description, order]
 * @file    file  – the actual document or video
 */
router.post(
  '/',
  protect,
  authorize('admin', 'faculty'),
  dynamicUpload,
  uploadMaterial
);

/**
 * @route   GET /api/materials/course/:courseId
 * @desc    List all materials for a specific course.
 *          Faculty/Admin see all (including hidden); students see only visible.
 * @access  Private – Admin | Faculty owner | Enrolled Student
 * NOTE: Defined BEFORE /:id to prevent "course" being matched as an ObjectId
 */
router.get('/course/:courseId', protect, getCourseMaterials);

/**
 * @route   GET /api/materials/:id
 * @desc    Get a single material by its ID
 * @access  Private – Admin | Faculty owner | Enrolled Student
 */
router.get('/:id', protect, getMaterialById);

/**
 * @route   PUT /api/materials/:id
 * @desc    Update material metadata (title, description, visibility, order).
 *          Does NOT support file replacement.
 * @access  Private – Admin | Faculty owner
 * @body    title?, description?, isVisible?, order?
 */
router.put('/:id', protect, authorize('admin', 'faculty'), updateMaterial);

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete a material record (physical file cleanup is handled separately)
 * @access  Private – Admin | Faculty owner
 */
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteMaterial);

module.exports = router;
