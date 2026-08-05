const mongoose = require('mongoose');

/**
 * Material Schema
 * Represents a learning resource (note PDF or video) attached to a course.
 * The `fileUrl` field stores the server-relative path produced by Multer;
 * it is resolved to an absolute URL at the API/response layer.
 */
const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    type: {
      type: String,
      required: [true, 'Material type is required'],
      enum: {
        values: ['note', 'video'],
        message: 'Type must be either "note" or "video"',
      },
    },

    fileUrl: {
      type: String,
      required: [true, 'File URL / path is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Material must be associated with a course'],
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
    },

    isVisible: {
      type: Boolean,
      default: true, // faculty can hide materials without deleting them
    },

    order: {
      type: Number,
      default: 0, // used to sort materials within a course
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/* ─── Compound index: quickly list all materials for a course in order ──── */
materialSchema.index({ course: 1, order: 1 });
materialSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Material', materialSchema);
