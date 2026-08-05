const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* ─────────────────────────────────────────────────────────────────────────────
 * Allowed MIME types per upload category
 * ───────────────────────────────────────────────────────────────────────────── */
const ALLOWED_MIME = {
  note: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Allowed extensions (second layer of defence – validates filename, not just
 * Content-Type header which can be spoofed by the client)
 * ───────────────────────────────────────────────────────────────────────────── */
const ALLOWED_EXT = {
  note:  ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'],
  video: ['.mp4', '.webm', '.ogg', '.mov', '.avi'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: ensure a directory exists, creating it (recursively) if needed.
 * ───────────────────────────────────────────────────────────────────────────── */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Storage engine factory
 * Creates a DiskStorage that routes files into the correct sub-folder based on
 * `req.uploadCategory`, which is set by each specific multer middleware below.
 * ───────────────────────────────────────────────────────────────────────────── */
const buildStorage = (subFolder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dest = path.join(__dirname, '..', 'uploads', subFolder);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      // Format: <timestamp>-<random>-<sanitised-original-name>
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      // Sanitise the base name: remove spaces, special chars, keep alphanumeric/hyphens
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 60); // cap length
      cb(null, `${uniqueSuffix}-${base}${ext}`);
    },
  });

/* ─────────────────────────────────────────────────────────────────────────────
 * Generic file-filter factory
 * Validates both MIME type and file extension for a given category.
 * ───────────────────────────────────────────────────────────────────────────── */
const buildFileFilter = (category) => (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME[category].includes(file.mimetype);
  const extOk  = ALLOWED_EXT[category].includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed ${category} extensions: ${ALLOWED_EXT[category].join(', ')}`
      ),
      false
    );
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Exported Multer instances
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * uploadNote
 * Accepts a single PDF/document field named "file".
 * Max size: 20 MB
 */
const uploadNote = multer({
  storage: buildStorage('notes'),
  fileFilter: buildFileFilter('note'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single('file');

/**
 * uploadVideo
 * Accepts a single video field named "file".
 * Max size: 500 MB
 */
const uploadVideo = multer({
  storage: buildStorage('videos'),
  fileFilter: buildFileFilter('video'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
}).single('file');

/**
 * uploadThumbnail
 * Accepts a single image field named "coverImage".
 * Max size: 5 MB
 */
const uploadThumbnail = multer({
  storage: buildStorage('thumbnails'),
  fileFilter: buildFileFilter('image'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('coverImage');

/* ─────────────────────────────────────────────────────────────────────────────
 * wrapMulter
 * Converts a Multer callback-based middleware into a promise so async route
 * handlers can await it and catch errors cleanly.
 *
 * @param {Function} multerMiddleware - result of multer().single() / .array()
 * @returns {Function} - Express middleware (req, res, next)
 * ───────────────────────────────────────────────────────────────────────────── */
const wrapMulter = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    // Multer-specific size limit error
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Please check the size limit for this upload type.',
      });
    }

    // File-filter rejection or other Multer error
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
    });
  });
};

module.exports = {
  uploadNote:      wrapMulter(uploadNote),
  uploadVideo:     wrapMulter(uploadVideo),
  uploadThumbnail: wrapMulter(uploadThumbnail),
};
