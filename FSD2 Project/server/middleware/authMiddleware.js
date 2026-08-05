const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/* ─────────────────────────────────────────────────────────────────────────────
 * protect
 * Validates the JWT supplied in the Authorization header and attaches the
 * authenticated user document to `req.user`.
 *
 * Expected header:  Authorization: Bearer <token>
 *
 * Fails with:
 *   401  – No / malformed token
 *   401  – Token expired or tampered
 *   401  – User no longer exists or has been deactivated
 * ───────────────────────────────────────────────────────────────────────────── */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  // 1. Extract token from "Bearer <token>"
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized – no token provided');
  }

  // 2. Verify the token (throws JsonWebTokenError / TokenExpiredError on failure)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    if (err.name === 'TokenExpiredError') {
      throw new Error('Not authorized – token has expired');
    }
    throw new Error('Not authorized – invalid token');
  }

  // 3. Confirm the user still exists and is active
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    res.status(401);
    throw new Error('Not authorized – user no longer exists');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Not authorized – account has been deactivated');
  }

  // 4. Attach user to request for downstream middleware / controllers
  req.user = user;
  next();
});

/* ─────────────────────────────────────────────────────────────────────────────
 * authorize(...roles)
 * Factory that returns a middleware restricting access to specified roles.
 * Must be used AFTER `protect` so `req.user` is already populated.
 *
 * Usage:
 *   router.delete('/users/:id', protect, authorize('admin'), deleteUser);
 *   router.post('/courses',     protect, authorize('admin', 'faculty'), createCourse);
 *
 * Fails with:
 *   403  – Authenticated but insufficient role
 * ───────────────────────────────────────────────────────────────────────────── */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Safety guard – protect() should always run first
      res.status(401);
      throw new Error('Not authorized – authentication required');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Forbidden – role '${req.user.role}' is not permitted to perform this action`
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
