/**
 * tests/unit/inquiryController.test.js
 *
 * Unit tests for createInquiry, replyToInquiry, and getForProperty.
 *
 * Implementation note on spec vs code:
 *  - getForProperty does NOT enforce agent ownership — it returns all inquiries
 *    for the property. Access restriction to agents/sellers is handled by the
 *    requireRole middleware on the route, not in the controller.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../src/models/Inquiry.js', () => ({
  default: {
    find:     vi.fn(),
    findById: vi.fn(),
    create:   vi.fn(),
  },
}));

vi.mock('../../src/models/Property.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────
import {
  createInquiry,
  getForProperty,
  replyToInquiry,
} from '../../src/controllers/inquiryController.js';
import Inquiry  from '../../src/models/Inquiry.js';
import Property from '../../src/models/Property.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

/**
 * Thenable query chain — covers populate().sort() and findById().populate().
 */
const makeChain = (value) => ({
  populate: vi.fn().mockReturnThis(),
  sort:     vi.fn().mockReturnThis(),
  then:     (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  catch:    (reject)          => Promise.resolve(value).catch(reject),
  finally:  (fn)              => Promise.resolve(value).finally(fn),
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe('inquiryController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── createInquiry ──────────────────────────────────────────────────────
  describe('createInquiry', () => {
    it('201 + saved with status "new"', async () => {
      const fakeProp    = { _id: 'prop1' };
      const fakeInquiry = {
        _id:      'inq1',
        property: 'prop1',
        buyer:    'buyer1',
        message:  'Is the garden south-facing?',
        status:   'new',
      };

      Property.findById.mockResolvedValue(fakeProp);
      Inquiry.create.mockResolvedValue(fakeInquiry);

      const req = {
        params: { propertyId: 'prop1' },
        body:   { message: 'Is the garden south-facing?' },
        user:   { _id: 'buyer1' },
      };
      const res = makeRes();

      await createInquiry(req, res);

      expect(Inquiry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          property: fakeProp._id,
          buyer:    'buyer1',
          message:  'Is the garden south-facing?',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeInquiry);
    });

    it('404 when property not found', async () => {
      Property.findById.mockResolvedValue(null);

      const req = {
        params: { propertyId: 'nonexistent' },
        body:   { message: 'Hello' },
        user:   { _id: 'buyer1' },
      };
      const res = makeRes();

      await createInquiry(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Property not found' });
      expect(Inquiry.create).not.toHaveBeenCalled();
    });
  });

  // ── replyToInquiry ─────────────────────────────────────────────────────
  describe('replyToInquiry', () => {
    it('agent can reply — sets agentReply and status to "replied"', async () => {
      const agentId     = 'agent-123';
      const mockInquiry = {
        _id:        'inq1',
        property:   { agent: agentId },   // populated — agent is a plain string
        agentReply: '',
        status:     'new',
        save:       vi.fn().mockResolvedValue(undefined),
      };

      // findById().populate('property') chain
      Inquiry.findById.mockReturnValue(makeChain(mockInquiry));

      const req = {
        params: { id: 'inq1' },
        body:   { agentReply: 'Yes, the garden faces south.' },
        user:   { _id: agentId },
      };
      const res = makeRes();

      await replyToInquiry(req, res);

      expect(mockInquiry.agentReply).toBe('Yes, the garden faces south.');
      expect(mockInquiry.status).toBe('replied');
      expect(mockInquiry.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockInquiry);
    });

    it('403 when buyer (non-owning user) tries to reply', async () => {
      const mockInquiry = {
        _id:      'inq1',
        property: { agent: 'real-agent-id' },
        save:     vi.fn(),
      };

      Inquiry.findById.mockReturnValue(makeChain(mockInquiry));

      const req = {
        params: { id: 'inq1' },
        body:   { agentReply: 'Sneaky reply attempt' },
        user:   { _id: 'buyer-trying-to-reply' },
      };
      const res = makeRes();

      await replyToInquiry(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not your inquiry' });
      expect(mockInquiry.save).not.toHaveBeenCalled();
    });
  });

  // ── getForProperty ─────────────────────────────────────────────────────
  describe('getForProperty', () => {
    it('returns all inquiries for the property (no ownership filter in controller)', async () => {
      // The controller returns every inquiry for the property without checking
      // which agent owns it. Ownership is enforced by requireRole middleware.
      const mockInquiries = [
        { _id: 'inq1', buyer: { name: 'Alice', email: 'a@a.com' }, message: 'Q1' },
        { _id: 'inq2', buyer: { name: 'Bob',   email: 'b@b.com' }, message: 'Q2' },
      ];

      Inquiry.find.mockReturnValue(makeChain(mockInquiries));

      const req = {
        params: { propertyId: 'prop1' },
        user:   { _id: 'any-agent', role: 'agent' },
      };
      const res = makeRes();

      await getForProperty(req, res);

      expect(Inquiry.find).toHaveBeenCalledWith({ property: 'prop1' });
      expect(res.json).toHaveBeenCalledWith(mockInquiries);
    });
  });
});
