const jwt = require('jsonwebtoken');

/**
 * generateToken
 * Signs a JWT containing the user's id and role.
 *
 * @param {string} id   - Mongoose ObjectId (as string)
 * @param {string} role - User role: 'admin' | 'faculty' | 'student'
 * @returns {string}    - Signed JWT string
 */
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
