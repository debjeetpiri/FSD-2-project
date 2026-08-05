const mongoose = require('mongoose');

/**
 * Submission Schema
 * Records a student's response to an Assignment.
 * A unique compound index on (assignment + student) enforces the business
 * rule that each student may submit only once per assignment.
 */
const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },

    fileUrl: {
      type: String,
      required: [true, 'Submission file URL / path is required'],
      trim: true,
    },

    score: {
      type: Number,
      default: null, // null until faculty grades the submission
      min: [0, 'Score cannot be negative'],
    },

    feedback: {
      type: String,
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
      default: '',
    },

    status: {
      type: String,
      enum: {
        values: ['submitted', 'graded', 'returned'],
        message: 'Status must be: submitted | graded | returned',
      },
      default: 'submitted',
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    gradedAt: {
      type: Date,
      default: null,
    },

    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isLate: {
      type: Boolean,
      default: false, // set to true at the API layer if submitted after dueDate
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─── Unique constraint: one submission per student per assignment ─────── */
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

/* ─── Index: quickly fetch all submissions for an assignment ─────────────── */
submissionSchema.index({ assignment: 1 });
submissionSchema.index({ student: 1 });

/* ─── Pre-save hook: auto-set gradedAt when status changes to "graded" ─── */
submissionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'graded' && !this.gradedAt) {
    this.gradedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);
