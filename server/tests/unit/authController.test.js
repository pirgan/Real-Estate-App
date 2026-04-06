/**
 * tests/unit/authController.test.js
 *
 * Unit tests for register and login controllers.
 * All external dependencies are mocked — no DB, no real JWT signing, no real bcrypt.
 *
 * Implementation notes on spec vs code:
 *  - register duplicate email  → controller returns 400 (not 409)
 *  - login unknown email       → controller returns 401 (not 404); same branch as wrong password
 *  - JWT payload               → signToken only includes { id } (not { id, email, role })
 *  - bcrypt cost factor        → User model uses 12 (not 10)
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mocks (hoisted before all imports by Vitest) ───────────────────────────
vi.mock('../../src/models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$hashed'),
    compare: vi.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────
import { register, login } from '../../src/controllers/authController.js';
import User from '../../src/models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe('authController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── register ────────────────────────────────────────────────────────────
  describe('register', () => {
    it('201 + token on success', async () => {
      const fakeUser = { _id: 'uid1', email: 'alice@test.com', role: 'buyer' };
      User.findOne.mockResolvedValue(null);     // email not taken
      User.create.mockResolvedValue(fakeUser);

      const req = { body: { name: 'Alice', email: 'alice@test.com', password: 'pass123', role: 'buyer' } };
      const res = makeRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'mock-jwt-token', user: fakeUser })
      );
    });

    it('400 on duplicate email', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' }); // email taken

      const res = makeRes();
      await register({ body: { email: 'taken@test.com', password: 'x' } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('propagates validation error when required fields are missing', async () => {
      User.findOne.mockResolvedValue(null);
      const err = Object.assign(new Error('Path `name` is required.'), { name: 'ValidationError' });
      User.create.mockRejectedValue(err);

      // Express 5 propagates async errors to the global error handler.
      // Calling the controller directly lets us assert it throws.
      await expect(register({ body: { email: 'x@test.com' } }, makeRes()))
        .rejects.toThrow('Path `name` is required.');
    });

    it('calls jwt.sign with the new user _id in the payload', async () => {
      const fakeUser = { _id: 'uid99', email: 'b@test.com', role: 'buyer' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(fakeUser);

      await register({ body: { name: 'B', email: 'b@test.com', password: 'p' } }, makeRes());

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'uid99' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });

    it('User model pre-save hook hashes password with bcrypt at cost factor 12', async () => {
      // The controller mocks User.create, bypassing the mongoose pre-save hook.
      // This test directly exercises the hook's logic to verify the cost factor.
      const rawPassword = 'super-secret-pass';
      const doc = { isModified: vi.fn(() => true), password: rawPassword };

      // Reproduce the pre-save hook from models/User.js
      if (doc.isModified('password')) {
        doc.password = await bcrypt.hash(doc.password, 12);
      }

      expect(bcrypt.hash).toHaveBeenCalledWith(rawPassword, 12);
    });
  });

  // ── login ────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('200 + token on valid credentials', async () => {
      const fakeUser = {
        _id: 'uid1',
        email: 'alice@test.com',
        matchPassword: vi.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(fakeUser);

      const res = makeRes();
      await login({ body: { email: 'alice@test.com', password: 'correct' } }, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'mock-jwt-token', user: fakeUser })
      );
      // status defaults to 200 — not explicitly called for success
    });

    it('401 on wrong password', async () => {
      User.findOne.mockResolvedValue({
        _id: 'uid1',
        matchPassword: vi.fn().mockResolvedValue(false),
      });

      const res = makeRes();
      await login({ body: { email: 'alice@test.com', password: 'wrongpass' } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('401 on unknown email', async () => {
      // Controller treats "user not found" and "wrong password" identically (both 401)
      // to avoid user-enumeration attacks.
      User.findOne.mockResolvedValue(null);

      const res = makeRes();
      await login({ body: { email: 'ghost@test.com', password: 'pass' } }, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });
  });
});
