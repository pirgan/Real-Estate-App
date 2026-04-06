import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware that enforces authentication on protected routes.
// Expects a Bearer token in the Authorization header, verifies it against JWT_SECRET,
// and attaches the corresponding User document (without password) to req.user.
// Calls next() on success; returns 401 if the token is missing, invalid, or the user no longer exists.
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised, no token' });
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // Covers JsonWebTokenError (invalid signature) and TokenExpiredError
    return res.status(401).json({ message: 'Not authorised, token invalid or expired' });
  }

  req.user = await User.findById(decoded.id).select('-password');
  if (!req.user) return res.status(401).json({ message: 'User not found' });
  next();
};
