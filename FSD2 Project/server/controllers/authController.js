const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: build the public user payload returned in responses.
 * Keeps the shape consistent across all auth endpoints.
 * ───────────────────────────────────────────────────────────────────────────── */
const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

/* ─────────────────────────────────────────────────────────────────────────────
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Body:
 *   { name, email, password, role? }
 *
 * Success  201 – user object + JWT
 * Errors   400 – missing/invalid fields | duplicate email
 *          500 – unexpected server error (handled by global error handler)
 * ───────────────────────────────────────────────────────────────────────────── */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // ── 1. Basic presence validation ──────────────────────────────────────────
  const missingFields = [];
  if (!name || name.trim().length < 2) missingFields.push('name (min 2 chars)');
  if (!email) missingFields.push('email');
  if (!password || password.length < 6) missingFields.push('password (min 6 chars)');

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(`Missing or invalid fields: ${missingFields.join(', ')}`);
  }

  // ── 2. Email format check ─────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  // ── 3. Role guard – only 'student' and 'faculty' can self-register.
  //       Admin accounts must be seeded or created by another admin.
  const allowedSelfRegisterRoles = ['student', 'faculty'];
  const assignedRole = role && allowedSelfRegisterRoles.includes(role) ? role : 'student';

  // ── 4. Duplicate email check ──────────────────────────────────────────────
  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // ── 5. Create user (password hashed by the pre-save hook in User.js) ─────
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,            // raw – Mongoose pre-save hook handles hashing
    role: assignedRole,
  });

  if (!user) {
    res.status(500);
    throw new Error('User could not be created – please try again');
  }

  // ── 6. Respond with user payload + signed JWT ─────────────────────────────
  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: buildUserPayload(user),
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * @desc    Authenticate user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Body:
 *   { email, password }
 *
 * Success  200 – user object + JWT
 * Errors   400 – missing fields
 *          401 – wrong credentials / inactive account
 * ───────────────────────────────────────────────────────────────────────────── */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // ── 1. Validate presence ───────────────────────────────────────────────────
  if (!email || !email.trim()) {
    res.status(400);
    throw new Error('Email is required');
  }
  if (!password) {
    res.status(400);
    throw new Error('Password is required');
  }

  // ── 2. Find user including the (normally hidden) password field ───────────
  //       Uses the static helper defined in User.js
  const user = await User.findByEmailWithPassword(email.trim().toLowerCase());

  // ── 3. Verify user exists and account is active ───────────────────────────
  //       We intentionally use one generic message to prevent user enumeration.
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('This account has been deactivated. Please contact support.');
  }

  // ── 4. Compare candidate password with the stored hash ────────────────────
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // ── 5. Issue JWT ──────────────────────────────────────────────────────────
  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: buildUserPayload(user),
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires valid JWT via `protect` middleware)
 *
 * Success  200 – user object (no password)
 * Errors   401 – handled upstream by protect middleware
 * ───────────────────────────────────────────────────────────────────────────── */
const getUserProfile = asyncHandler(async (req, res) => {
  // `req.user` is populated by the `protect` middleware
  // We re-fetch to guarantee we always return the latest state from the DB
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    user: buildUserPayload(user),
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * @desc    Update the logged-in user's own name / profileImage
 * @route   PUT /api/auth/me
 * @access  Private
 *
 * Body (all optional):
 *   { name, profileImage }
 *
 * Success  200 – updated user object
 * Errors   400 – invalid data
 * ───────────────────────────────────────────────────────────────────────────── */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, profileImage } = req.body;

  // Validate name length if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400);
      throw new Error('Name must be at least 2 characters');
    }
    user.name = name.trim();
  }

  if (profileImage !== undefined) {
    user.profileImage = profileImage.trim();
  }

  const updated = await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: buildUserPayload(updated),
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
 * @desc    Change the logged-in user's password
 * @route   PUT /api/auth/change-password
 * @access  Private
 *
 * Body:
 *   { currentPassword, newPassword }
 *
 * Success  200 – confirmation message + new JWT
 * Errors   400 – missing / weak new password
 *          401 – current password wrong
 * ───────────────────────────────────────────────────────────────────────────── */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Both currentPassword and newPassword are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  // Re-fetch with password field
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Assigning triggers the pre-save hook to hash the new password
  user.password = newPassword;
  await user.save();

  // Rotate the token so old sessions are invalidated on the client side
  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    token,
  });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
