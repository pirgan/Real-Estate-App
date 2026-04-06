/**
 * tests/unit/propertyController.test.js
 *
 * Unit tests for propertyController and the requireRole middleware
 * (role enforcement sits on the route, not in the controller itself).
 *
 * Mocked: Property model (find/findById/create/countDocuments).
 * All mongoose query chains are simulated with a thenable helper.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../src/models/Property.js', () => ({
  default: {
    find:            vi.fn(),
    findById:        vi.fn(),
    create:          vi.fn(),
    countDocuments:  vi.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────
import {
  getProperties,
  createProperty,
  updateProperty,
  archiveProperty,
  searchProperties,
} from '../../src/controllers/propertyController.js';
import Property from '../../src/models/Property.js';
import { requireRole } from '../../src/middleware/roleMiddleware.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

/**
 * Returns a thenable object that mimics a Mongoose query chain.
 * Every chaining method (populate, skip, limit, sort, lean) returns `this`
 * so tests can mock any chain order. Awaiting the chain resolves to `value`.
 */
const makeChain = (value) => ({
  populate: vi.fn().mockReturnThis(),
  skip:     vi.fn().mockReturnThis(),
  limit:    vi.fn().mockReturnThis(),
  sort:     vi.fn().mockReturnThis(),
  lean:     vi.fn().mockReturnThis(),
  then:     (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  catch:    (reject)          => Promise.resolve(value).catch(reject),
  finally:  (fn)              => Promise.resolve(value).finally(fn),
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe('propertyController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── getProperties ──────────────────────────────────────────────────────
  describe('getProperties', () => {
    it('returns only active listings', async () => {
      const chain = makeChain([]);
      Property.find.mockReturnValue(chain);
      Property.countDocuments.mockResolvedValue(0);

      await getProperties({ query: {} }, makeRes());

      expect(Property.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });

    it('populates the agent field with name and email', async () => {
      const fakeProps = [{ _id: 'p1', title: 'Flat', agent: { name: 'Bob', email: 'b@b.com' } }];
      const chain = makeChain(fakeProps);
      Property.find.mockReturnValue(chain);
      Property.countDocuments.mockResolvedValue(1);

      const res = makeRes();
      await getProperties({ query: {} }, res);

      expect(chain.populate).toHaveBeenCalledWith('agent', 'name email');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ properties: fakeProps, total: 1 })
      );
    });
  });

  // ── createProperty ─────────────────────────────────────────────────────
  describe('createProperty', () => {
    it('201 + property saved to DB with the agent id attached', async () => {
      const fakeProp = { _id: 'prop1', title: 'House', agent: 'agent-id' };
      Property.create.mockResolvedValue(fakeProp);

      const req = {
        body: { title: 'House', price: 400_000, propertyType: 'house' },
        user: { _id: 'agent-id', role: 'agent' },
      };
      const res = makeRes();

      await createProperty(req, res);

      expect(Property.create).toHaveBeenCalledWith(
        expect.objectContaining({ agent: 'agent-id' })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeProp);
    });

    it('403 when role is not agent (requireRole middleware check)', () => {
      // The controller itself does not check roles — enforcement is done by
      // requireRole('agent', 'seller') on the POST /api/properties route.
      // We test the middleware directly here.
      const middleware = requireRole('agent', 'seller');
      const req = { user: { role: 'buyer' } };
      const res = makeRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ── updateProperty ─────────────────────────────────────────────────────
  describe('updateProperty', () => {
    it('agent can update their own listing', async () => {
      const agentId = 'agent-abc';
      const mockProp = {
        agent: agentId,    // plain string — .toString() works natively
        price: 100_000,
        save: vi.fn().mockResolvedValue(undefined),
      };
      Property.findById.mockResolvedValue(mockProp);

      const req = {
        params: { id: 'prop1' },
        body:   { price: 200_000 },
        user:   { _id: agentId },
      };
      const res = makeRes();

      await updateProperty(req, res);

      expect(mockProp.price).toBe(200_000);      // Object.assign applied
      expect(mockProp.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockProp);
    });

    it('403 when updating another agent\'s listing', async () => {
      Property.findById.mockResolvedValue({
        agent: 'real-owner-id',
        save: vi.fn(),
      });

      const req = {
        params: { id: 'prop1' },
        body:   { price: 999_999 },
        user:   { _id: 'intruder-id' },
      };
      const res = makeRes();

      await updateProperty(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not your listing' });
    });
  });

  // ── archiveProperty ────────────────────────────────────────────────────
  describe('archiveProperty', () => {
    it('sets status to "archived" and persists', async () => {
      const agentId = 'agent-xyz';
      const mockProp = {
        agent:  agentId,
        status: 'active',
        save:   vi.fn().mockResolvedValue(undefined),
      };
      Property.findById.mockResolvedValue(mockProp);

      const req = { params: { id: 'prop1' }, user: { _id: agentId } };
      const res = makeRes();

      await archiveProperty(req, res);

      expect(mockProp.status).toBe('archived');
      expect(mockProp.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Property archived', property: mockProp })
      );
    });
  });

  // ── searchProperties ───────────────────────────────────────────────────
  describe('searchProperties', () => {
    it('$text search returns matching results filtered by status: active', async () => {
      const fakeResults = [{ _id: 'p1', title: 'London Studio' }];
      Property.find.mockReturnValue(makeChain(fakeResults));

      const req = { query: { q: 'london studio' } };
      const res = makeRes();

      await searchProperties(req, res);

      expect(Property.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $text:  { $search: 'london studio' },
          status: 'active',
        }),
        expect.any(Object)   // { score: { $meta: 'textScore' } } projection
      );
      expect(res.json).toHaveBeenCalledWith(fakeResults);
    });

    it('400 when query param q is missing', async () => {
      const res = makeRes();
      await searchProperties({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Property.find).not.toHaveBeenCalled();
    });
  });
});
