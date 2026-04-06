import Property from '../models/Property.js';

// GET /api/properties
// Returns a paginated list of active properties filtered by optional query params:
// city, minPrice, maxPrice, propertyType, bedrooms, page, limit (default 12 per page).
// Responds with { properties, total, page, pages }.
export const getProperties = async (req, res) => {
  const { city, minPrice, maxPrice, propertyType, bedrooms, page = 1, limit = 12 } = req.query;

  const filter = { status: 'active' };
  if (city) filter['location.city'] = { $regex: city, $options: 'i' };
  if (propertyType) filter.propertyType = propertyType;
  if (bedrooms) filter.bedrooms = { $gte: Number(bedrooms) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [properties, total] = await Promise.all([
    Property.find(filter).populate('agent', 'name email').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Property.countDocuments(filter),
  ]);

  res.json({ properties, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

// GET /api/properties/:id
// Returns a single property by its MongoDB ID with the agent's name and email populated.
// Returns 404 if no matching property is found.
export const getById = async (req, res) => {
  const property = await Property.findById(req.params.id).populate('agent', 'name email');
  if (!property) return res.status(404).json({ message: 'Property not found' });
  res.json(property);
};

// POST /api/properties
// Creates a new property listing and assigns it to the authenticated user (agent/seller).
// Returns the created property document.
export const createProperty = async (req, res) => {
  const property = await Property.create({ ...req.body, agent: req.user._id });
  res.status(201).json(property);
};

// PUT /api/properties/:id
// Updates fields on an existing property listing.
// Only the agent who created the listing can update it; returns 403 for other users.
export const updateProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });
  if (property.agent.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your listing' });
  }

  Object.assign(property, req.body);
  await property.save();
  res.json(property);
};

// PATCH /api/properties/:id/archive
// Sets the property status to 'archived', hiding it from active listings.
// Only the owning agent/seller can archive; returns 403 for other users.
export const archiveProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });
  if (property.agent.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your listing' });
  }

  property.status = 'archived';
  await property.save();
  res.json({ message: 'Property archived', property });
};

// GET /api/properties/search?q=<term>
// Performs a MongoDB full-text search across title, description, and city fields.
// Results are ranked by text relevance score; limited to 20 active properties.
export const searchProperties = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Search query required' });

  const properties = await Property.find(
    { $text: { $search: q }, status: 'active' },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .populate('agent', 'name email');

  res.json(properties);
};
