import { anthropic } from '../config/anthropic.js';
import Property from '../models/Property.js';
import DocumentChunk from '../models/DocumentChunk.js';

const MODEL = 'claude-sonnet-4-6';

// POST /api/ai/properties/:id/description
// Uses Claude to generate a compelling 3-paragraph estate agent description for the property.
// Persists the result in property.aiDescription and returns it in the response.
export const generateDescription = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });

  const prompt = `Write a compelling, 3-paragraph estate agent description for this property.
Property details:
- Title: ${property.title}
- Type: ${property.propertyType}
- Price: £${property.price.toLocaleString()}
- Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
- Address: ${property.location.address}, ${property.location.city} ${property.location.postcode}
Tone: professional, warm, aspirational. Max 200 words.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const description = message.content[0].text;
  property.aiDescription = description;
  await property.save();

  res.json({ description });
};

// POST /api/ai/properties/:id/valuation
// Asks Claude to analyse the property and return a JSON valuation object containing:
// verdict, confidence score, estimated price-per-sqft, rental yield, market trend, and recommendation.
// Persists the result in property.aiValuation and returns it in the response.
export const valuationInsights = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });

  const prompt = `You are a UK property valuation expert. Analyse this listing and return a JSON object with:
- verdict: "Fairly Priced" | "Overpriced" | "Great Deal"
- confidence: number 0-100
- pricePerSqFt: estimated number (GBP)
- rentalYield: estimated percentage string
- marketTrend: short sentence about the local market
- recommendation: one actionable sentence for buyers

Property: ${property.title}, ${property.location.city}
Type: ${property.propertyType}, Price: £${property.price.toLocaleString()}
Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}

Respond with valid JSON only.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const valuation = JSON.parse(message.content[0].text);
  property.aiValuation = valuation;
  await property.save();

  res.json(valuation);
};

// POST /api/ai/properties/:id/analyse-photos
// Sends up to 5 property images to Claude's vision model for analysis.
// Returns a JSON array describing each image's room type, condition, and key features.
export const analysePhotos = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });
  if (!property.images.length) return res.status(400).json({ message: 'No images to analyse' });

  const imageContent = property.images.slice(0, 5).map((img) => ({
    type: 'image',
    source: { type: 'url', url: img.url },
  }));

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: 'You are a property photo analyst. For each image identify the room type, condition (excellent/good/fair/poor), and key features. Return a JSON array of objects: [{roomType, condition, features[]}]. Respond with valid JSON only.',
          },
        ],
      },
    ],
  });

  const analysis = JSON.parse(message.content[0].text);
  res.json({ analysis });
};

// GET /api/ai/recommendations?preferences=<text>
// Loads up to 50 active properties and asks Claude to rank them against the buyer's
// free-text preferences, returning the top 5 matching property documents.
export const recommendProperties = async (req, res) => {
  const { preferences } = req.query;
  if (!preferences) return res.status(400).json({ message: 'preferences query param required' });

  const properties = await Property.find({ status: 'active' }).limit(50).lean();

  const prompt = `You are a property recommendation engine. Based on the buyer preferences below, rank the given properties and return the top 5 IDs as a JSON array.

Buyer preferences: ${preferences}

Properties (JSON):
${JSON.stringify(
  properties.map((p) => ({
    id: p._id,
    title: p.title,
    type: p.propertyType,
    price: p.price,
    bedrooms: p.bedrooms,
    city: p.location.city,
  }))
)}

Respond with a JSON array of up to 5 property IDs only, e.g. ["id1","id2"].`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const ids = JSON.parse(message.content[0].text);
  const recommended = properties.filter((p) => ids.includes(p._id.toString()));
  res.json(recommended);
};

// POST /api/ai/search
// Parses a natural-language property query with Claude to extract structured filters
// (city, price range, bedrooms, propertyType), then queries MongoDB with those filters.
// Returns both the extracted filters and the matching active property documents.
export const nlSearch = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'query required' });

  const extractPrompt = `Extract structured search filters from this natural language property query.
Return JSON with these optional fields: city, minPrice, maxPrice, bedrooms, propertyType (house/flat/studio/commercial), keywords.
Query: "${query}"
Respond with valid JSON only.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: 'user', content: extractPrompt }],
  });

  const filters = JSON.parse(message.content[0].text);

  const mongoFilter = { status: 'active' };
  if (filters.city) mongoFilter['location.city'] = { $regex: filters.city, $options: 'i' };
  if (filters.propertyType) mongoFilter.propertyType = filters.propertyType;
  if (filters.bedrooms) mongoFilter.bedrooms = { $gte: filters.bedrooms };
  if (filters.minPrice || filters.maxPrice) {
    mongoFilter.price = {};
    if (filters.minPrice) mongoFilter.price.$gte = filters.minPrice;
    if (filters.maxPrice) mongoFilter.price.$lte = filters.maxPrice;
  }

  const properties = await Property.find(mongoFilter)
    .limit(20)
    .populate('agent', 'name email');

  res.json({ filters, properties });
};

// POST /api/ai/chat
// RAG-based chatbot for Meridian Realty Group.
// Retrieves the top 5 most relevant DocumentChunk records via MongoDB $text search,
// injects them as context into the Claude system prompt, and generates a grounded answer.
// Accepts optional conversation history to support multi-turn dialogue.
// Returns { reply, citations } where citations list the source documents used.
export const ragChat = async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ message: 'message required' });

  // Retrieve relevant chunks via $text search
  const chunks = await DocumentChunk.find(
    { $text: { $search: message } },
    { score: { $meta: 'textScore' }, content: 1, source: 1, section: 1 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .lean();

  const context = chunks
    .map((c) => `[${c.source} — ${c.section}]\n${c.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are the Meridian Realty Group AI assistant. Answer questions about buying, selling, mortgages, and local area guides using ONLY the context provided. If the answer is not in the context, say so honestly.

Context:
${context || 'No relevant documents found.'}`;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const citations = chunks.map((c) => ({ source: c.source, section: c.section }));
  res.json({ reply: response.content[0].text, citations });
};
