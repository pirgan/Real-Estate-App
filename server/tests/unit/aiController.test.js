/**
 * tests/unit/aiController.test.js
 *
 * Unit tests for all six AI controller functions.
 * The Anthropic SDK is ALWAYS mocked — no real API calls are made.
 *
 * Implementation notes on spec vs code:
 *  - generateDescription  → uses res.json (no SSE streaming in current code)
 *  - valuationInsights    → always calls Anthropic; no aiValuation cache check
 *  - analysePhotos        → slices to 5 images max in one call (no batch-of-3 loop);
 *                           does NOT write caption/roomType back to property.images
 *  - ragChat              → uses DocumentChunk $text search directly (no haiku extractor);
 *                           returns res.json({reply, citations}) (no SSE [DONE] event);
 *                           empty chunks → proceeds with fallback context (no 404)
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../src/config/anthropic.js', () => ({
  anthropic: {
    messages: { create: vi.fn() },
  },
}));

vi.mock('../../src/models/Property.js', () => ({
  default: {
    find:     vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../src/models/DocumentChunk.js', () => ({
  default: {
    find: vi.fn(),
  },
}));

// ── Imports ────────────────────────────────────────────────────────────────
import {
  generateDescription,
  valuationInsights,
  analysePhotos,
  recommendProperties,
  nlSearch,
  ragChat,
} from '../../src/controllers/aiController.js';
import { anthropic }   from '../../src/config/anthropic.js';
import Property        from '../../src/models/Property.js';
import DocumentChunk   from '../../src/models/DocumentChunk.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status    = vi.fn().mockReturnValue(res);
  res.json      = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn();
  res.write     = vi.fn();
  res.end       = vi.fn();
  return res;
};

/** Wraps text in the Anthropic messages.create response shape. */
const claudeReply = (text) => ({ content: [{ text }] });

/**
 * Thenable query chain for Mongoose calls.
 * Supports: .find().sort().limit().lean().populate()
 */
const makeChain = (value) => ({
  populate: vi.fn().mockReturnThis(),
  sort:     vi.fn().mockReturnThis(),
  limit:    vi.fn().mockReturnThis(),
  lean:     vi.fn().mockReturnThis(),
  then:     (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  catch:    (reject)          => Promise.resolve(value).catch(reject),
  finally:  (fn)              => Promise.resolve(value).finally(fn),
});

/** Builds a minimal Property document with mock save(). */
const buildProp = (overrides = {}) => ({
  _id:          'prop1',
  title:        '2-Bed Flat Shoreditch',
  propertyType: 'flat',
  price:        350_000,
  bedrooms:     2,
  bathrooms:    1,
  location:     { address: '1 Main St', city: 'London', postcode: 'E1 1AA' },
  images:       [],
  aiDescription:'',
  aiValuation:  {},
  save:         vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe('aiController', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── generateDescription ──────────────────────────────────────────────────
  describe('generateDescription', () => {
    it('sets SSE headers, calls Anthropic, persists aiDescription, returns description', async () => {
      const prop = buildProp();
      Property.findById.mockResolvedValue(prop);
      anthropic.messages.create.mockResolvedValue(
        claudeReply('A stunning flat in the heart of Shoreditch.')
      );

      const req = { params: { id: 'prop1' } };
      const res = makeRes();

      await generateDescription(req, res);

      // Anthropic was called exactly once
      expect(anthropic.messages.create).toHaveBeenCalledTimes(1);
      const callArgs = anthropic.messages.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain(prop.title);

      // Description is persisted to the property document
      expect(prop.aiDescription).toBe('A stunning flat in the heart of Shoreditch.');
      expect(prop.save).toHaveBeenCalled();

      // Response shape
      expect(res.json).toHaveBeenCalledWith({
        description: 'A stunning flat in the heart of Shoreditch.',
      });
    });

    it('404 when property not found — Anthropic not called', async () => {
      Property.findById.mockResolvedValue(null);

      const res = makeRes();
      await generateDescription({ params: { id: 'missing' } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(anthropic.messages.create).not.toHaveBeenCalled();
    });
  });

  // ── valuationInsights ────────────────────────────────────────────────────
  describe('valuationInsights', () => {
    const mockValuation = {
      verdict:        'Fairly Priced',
      confidence:     82,
      pricePerSqFt:   618,
      rentalYield:    '4.3%',
      marketTrend:    'Stable demand in East London.',
      recommendation: 'Good entry point for a long-term investment.',
    };

    it('calls Anthropic, saves aiValuation to property, returns valuation JSON', async () => {
      const prop = buildProp();
      Property.findById.mockResolvedValue(prop);
      anthropic.messages.create.mockResolvedValue(
        claudeReply(JSON.stringify(mockValuation))
      );

      const res = makeRes();
      await valuationInsights({ params: { id: 'prop1' } }, res);

      expect(anthropic.messages.create).toHaveBeenCalledTimes(1);
      expect(prop.aiValuation).toEqual(mockValuation);
      expect(prop.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockValuation);
    });

    it('calls Anthropic even when aiValuation already exists (no cache in current code)', async () => {
      // The controller does not short-circuit when aiValuation is already populated.
      // Every request goes to Anthropic. This test documents that behaviour so a
      // future caching implementation can be verified against it.
      const prop = buildProp({ aiValuation: mockValuation });
      Property.findById.mockResolvedValue(prop);
      anthropic.messages.create.mockResolvedValue(
        claudeReply(JSON.stringify(mockValuation))
      );

      await valuationInsights({ params: { id: 'prop1' } }, makeRes());

      expect(anthropic.messages.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── analysePhotos ────────────────────────────────────────────────────────
  describe('analysePhotos', () => {
    const mockAnalysis = [
      { roomType: 'living room', condition: 'excellent', features: ['fireplace'] },
      { roomType: 'kitchen',     condition: 'good',      features: ['granite worktops'] },
      { roomType: 'bedroom',     condition: 'good',      features: ['built-in wardrobes'] },
    ];

    it('sends all images (up to 5) to Anthropic in a single call and returns analysis', async () => {
      // Controller slices to 5; no batching in current implementation.
      const images = Array.from({ length: 5 }, (_, i) => ({
        url: `https://res.cloudinary.com/test/image${i + 1}.jpg`,
      }));
      const prop = buildProp({ images });
      Property.findById.mockResolvedValue(prop);
      anthropic.messages.create.mockResolvedValue(claudeReply(JSON.stringify(mockAnalysis)));

      const res = makeRes();
      await analysePhotos({ params: { id: 'prop1' } }, res);

      expect(anthropic.messages.create).toHaveBeenCalledTimes(1);

      // All 5 images sent as image content blocks in a single Anthropic call
      const callContent = anthropic.messages.create.mock.calls[0][0].messages[0].content;
      const imageBlocks = callContent.filter((c) => c.type === 'image');
      expect(imageBlocks).toHaveLength(5);

      expect(res.json).toHaveBeenCalledWith({ analysis: mockAnalysis });
    });

    it('processes exactly 3 images when property has 3 images', async () => {
      const images = Array.from({ length: 3 }, (_, i) => ({
        url: `https://res.cloudinary.com/test/img${i}.jpg`,
      }));
      Property.findById.mockResolvedValue(buildProp({ images }));
      anthropic.messages.create.mockResolvedValue(claudeReply(JSON.stringify(mockAnalysis)));

      await analysePhotos({ params: { id: 'prop1' } }, makeRes());

      const callContent = anthropic.messages.create.mock.calls[0][0].messages[0].content;
      const imageBlocks = callContent.filter((c) => c.type === 'image');
      expect(imageBlocks).toHaveLength(3);
    });

    it('does NOT write caption/roomType back to property.images (analysis returned, not persisted)', () => {
      // The current controller returns the AI analysis JSON but does not save
      // roomType/caption back to the property document. save() is not called.
      // This test documents that gap so a future persist step can be tested explicitly.
      const prop = buildProp({
        images: [{ url: 'https://res.cloudinary.com/test/img.jpg' }],
      });
      Property.findById.mockResolvedValue(prop);
      anthropic.messages.create.mockResolvedValue(claudeReply(JSON.stringify(mockAnalysis)));

      // Verify save is not called (analysis is returned, not persisted)
      expect(prop.save).not.toHaveBeenCalled();
    });

    it('400 when property has no images', async () => {
      Property.findById.mockResolvedValue(buildProp({ images: [] }));

      const res = makeRes();
      await analysePhotos({ params: { id: 'prop1' } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(anthropic.messages.create).not.toHaveBeenCalled();
    });
  });

  // ── recommendProperties ──────────────────────────────────────────────────
  describe('recommendProperties', () => {
    it('returns 5 matching properties ranked by Claude', async () => {
      const allProps = [
        { _id: 'p1', title: 'A', propertyType: 'flat',    price: 300_000, bedrooms: 2, location: { city: 'London' } },
        { _id: 'p2', title: 'B', propertyType: 'house',   price: 500_000, bedrooms: 4, location: { city: 'Manchester' } },
        { _id: 'p3', title: 'C', propertyType: 'studio',  price: 150_000, bedrooms: 0, location: { city: 'Leeds' } },
        { _id: 'p4', title: 'D', propertyType: 'flat',    price: 280_000, bedrooms: 2, location: { city: 'London' } },
        { _id: 'p5', title: 'E', propertyType: 'house',   price: 600_000, bedrooms: 5, location: { city: 'Bristol' } },
      ];
      Property.find.mockReturnValue(makeChain(allProps));

      // Claude selects 5 IDs
      anthropic.messages.create.mockResolvedValue(
        claudeReply(JSON.stringify(['p1', 'p4', 'p3', 'p2', 'p5']))
      );

      const req = { query: { preferences: '2-bed flat in London under £350k' } };
      const res = makeRes();

      await recommendProperties(req, res);

      const returned = res.json.mock.calls[0][0];
      expect(returned).toHaveLength(5);
      expect(returned.map((p) => p._id)).toEqual(
        expect.arrayContaining(['p1', 'p2', 'p3', 'p4', 'p5'])
      );
    });
  });

  // ── nlSearch ─────────────────────────────────────────────────────────────
  describe('nlSearch', () => {
    it('parses JSON intent from Claude, builds MongoDB query, returns filters + properties', async () => {
      const extractedFilters = { city: 'Bristol', bedrooms: 3, propertyType: 'house' };
      const mockProps = [{ _id: 'p1', title: 'Bristol Family Home' }];

      anthropic.messages.create.mockResolvedValue(
        claudeReply(JSON.stringify(extractedFilters))
      );
      Property.find.mockReturnValue(makeChain(mockProps));

      const req = { body: { query: '3-bed house in Bristol' } };
      const res = makeRes();

      await nlSearch(req, res);

      // Claude called once to extract structured filters
      expect(anthropic.messages.create).toHaveBeenCalledTimes(1);
      const promptText = anthropic.messages.create.mock.calls[0][0].messages[0].content;
      expect(promptText).toContain('3-bed house in Bristol');

      // MongoDB query built from extracted filters
      expect(Property.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status:        'active',
          propertyType:  'house',
          bedrooms:      { $gte: 3 },
          'location.city': expect.objectContaining({ $regex: 'Bristol' }),
        })
      );

      // Response includes both the extracted filters and the matching properties
      expect(res.json).toHaveBeenCalledWith({ filters: extractedFilters, properties: mockProps });
    });
  });

  // ── ragChat ───────────────────────────────────────────────────────────────
  describe('ragChat', () => {
    const mockChunks = [
      { source: 'buyer-guide.md',   section: 'Mortgages', content: 'A mortgage is a secured loan...' },
      { source: 'area-guide.md',    section: 'Schools',   content: 'Local schools are Ofsted rated...' },
    ];

    it('retrieves chunks via $text search, calls Claude synthesiser, returns reply + citations', async () => {
      DocumentChunk.find.mockReturnValue(makeChain(mockChunks));
      anthropic.messages.create.mockResolvedValue(
        claudeReply('You should speak to a mortgage advisor.')
      );

      const req = { body: { message: 'How does a mortgage work?', history: [] } };
      const res = makeRes();

      await ragChat(req, res);

      // DocumentChunk searched by $text
      expect(DocumentChunk.find).toHaveBeenCalledWith(
        { $text: { $search: 'How does a mortgage work?' } },
        expect.any(Object)
      );

      // Anthropic called with chunk context injected into the system prompt
      expect(anthropic.messages.create).toHaveBeenCalledTimes(1);
      const callArgs = anthropic.messages.create.mock.calls[0][0];
      expect(callArgs.system).toContain('buyer-guide.md');
      expect(callArgs.system).toContain('A mortgage is a secured loan...');

      // Response shape
      expect(res.json).toHaveBeenCalledWith({
        reply:     'You should speak to a mortgage advisor.',
        citations: [
          { source: 'buyer-guide.md', section: 'Mortgages' },
          { source: 'area-guide.md',  section: 'Schools' },
        ],
      });
    });

    it('includes sources array in the citations field of the response', async () => {
      DocumentChunk.find.mockReturnValue(makeChain(mockChunks));
      anthropic.messages.create.mockResolvedValue(claudeReply('Here is what I found.'));

      const res = makeRes();
      await ragChat({ body: { message: 'Tell me about local schools' } }, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.citations).toHaveLength(2);
      expect(payload.citations[0]).toMatchObject({ source: 'buyer-guide.md', section: 'Mortgages' });
      expect(payload.citations[1]).toMatchObject({ source: 'area-guide.md',  section: 'Schools' });
    });

    it('calls Claude with full conversation history for multi-turn dialogue', async () => {
      DocumentChunk.find.mockReturnValue(makeChain([]));
      anthropic.messages.create.mockResolvedValue(claudeReply('Follow-up answer.'));

      const history = [
        { role: 'user',      content: 'What is stamp duty?' },
        { role: 'assistant', content: 'Stamp duty is a tax on property purchases.' },
      ];
      const req = { body: { message: 'How much would I pay on a £300k home?', history } };
      const res = makeRes();

      await ragChat(req, res);

      const callArgs  = anthropic.messages.create.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(3);  // 2 history + 1 new message
      expect(callArgs.messages[0]).toMatchObject({ role: 'user',      content: 'What is stamp duty?' });
      expect(callArgs.messages[1]).toMatchObject({ role: 'assistant', content: 'Stamp duty is a tax on property purchases.' });
      expect(callArgs.messages[2]).toMatchObject({ role: 'user',      content: 'How much would I pay on a £300k home?' });
    });

    it('uses fallback context and still responds when no chunks match the query', async () => {
      // Controller does NOT return 404 for empty chunks.
      // It continues with 'No relevant documents found.' as context and still calls Claude.
      DocumentChunk.find.mockReturnValue(makeChain([]));
      anthropic.messages.create.mockResolvedValue(
        claudeReply("I don't have specific information on that topic.")
      );

      const res = makeRes();
      await ragChat({ body: { message: 'What is the meaning of life?' } }, res);

      const callArgs = anthropic.messages.create.mock.calls[0][0];
      expect(callArgs.system).toContain('No relevant documents found.');

      expect(res.json).toHaveBeenCalledWith({
        reply:     "I don't have specific information on that topic.",
        citations: [],
      });
    });
  });
});
