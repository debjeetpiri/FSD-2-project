const mongoose = require('mongoose');

/**
 * Assignment Schema
 * Created by a faculty member and scoped to a specific course.
 * Students submit their work via the Submission model.
 */
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator: function (value) {
          // Due date must be in the future when the assignment is first created
          if (this.isNew) {
            return value > Date.now();
          }
          return true; // allow updates without re-validating the date
        },
        message: 'Due date must be a future date',
      },
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Assignment must be linked to a course'],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },

    maxScore: {
      type: Number,
      default: 100,
      min: [1, 'Max score must be at least 1'],
      max: [1000, 'Max score cannot exceed 1000'],
    },

    isActive: {
      type: Boolean,
      default: true, // faculty can deactivate an assignment after the deadline
    },

    attachmentUrl: {
      type: String,
      default: '', // optional reference document provided by faculty
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─── Virtual: check if the assignment is past its due date ─────────────── */
assignmentSchema.virtual('isOverdue').get(function () {
  return this.dueDate < new Date();
});

/* ─── Index: list all assignments for a course efficiently ──────────────── */
assignmentSchema.index({ course: 1, dueDate: 1 });
assignmentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
