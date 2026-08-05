const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Supports three roles: admin | faculty | student
 * Passwords are hashed via a pre-save hook so plain-text is never persisted.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password in queries by default
    },

    role: {
      type: String,
      enum: {
        values: ['admin', 'faculty', 'student'],
        message: 'Role must be one of: admin, faculty, student',
      },
      default: 'student',
    },

    profileImage: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // automatically manages createdAt & updatedAt
  }
);

/* ─── Pre-save hook: hash the password before persisting ─────────────────── */
userSchema.pre('save', async function (next) {
  // Only hash if the password field was actually modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/* ─── Instance method: verify a candidate plain-text password ─────────────── */
userSchema.methods.matchPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ─── Static method: find active user by email (includes password) ─────────── */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email, isActive: true }).select('+password');
};

/* ─── Virtual: full profile URL (convenience helper) ──────────────────────── */
userSchema.virtual('profileImageUrl').get(function () {
  return this.profileImage
    ? `/uploads/profiles/${this.profileImage}`
    : '/assets/default-avatar.png';
});

module.exports = mongoose.model('User', userSchema);
