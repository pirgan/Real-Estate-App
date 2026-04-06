import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Signs a JWT containing the user's ID, valid for 7 days.
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
// Creates a new user account with the provided name, email, password, and role.
// Returns a signed JWT and the created user object (password excluded).
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ token: signToken(user._id), user });
};

// POST /api/auth/login
// Authenticates a user by email and password.
// Returns a signed JWT and the user object if credentials are valid; 401 otherwise.
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');

  let passwordMatch = false;
  try {
    passwordMatch = user ? await user.matchPassword(password) : false;
  } catch {
    // Corrupt hash in DB (e.g. stored plain-text from a broken pre-save hook).
    // Treat as invalid credentials — never leak the internal error.
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user || !passwordMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ token: signToken(user._id), user });
};

// GET /api/auth/me
// Returns the authenticated user's profile.
// Used by AuthContext on mount to rehydrate the session after a page refresh.
export const getMe = async (req, res) => {
  res.json(req.user);
};
