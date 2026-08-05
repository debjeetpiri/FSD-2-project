const mongoose = require('mongoose');

/**
 * Course Schema
 * A course is owned by a single faculty member and can have many enrolled
 * students.  The `enrolledStudents` array stores ObjectId refs so we can
 * populate full user documents when required.
 */
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'Programming',
          'Design',
          'Business',
          'Science',
          'Mathematics',
          'Language',
          'Arts',
          'Other',
        ],
        message: '{VALUE} is not a supported category',
      },
    },

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A course must be assigned to a faculty member'],
    },

    coverImage: {
      type: String,
      default: '', // relative path stored; resolved to a URL at the API layer
    },

    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
    },

    duration: {
      type: String, // e.g. "8 weeks", "30 hours" – kept flexible as a string
      default: '',
    },

    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ─── Virtual: total number of enrolled students ─────────────────────────── */
courseSchema.virtual('enrollmentCount').get(function () {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

/* ─── Index: improve look-up speed when filtering by faculty / category ──── */
courseSchema.index({ faculty: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ title: 'text', description: 'text' }); // full-text search

module.exports = mongoose.model('Course', courseSchema);
