import Inquiry from '../models/Inquiry.js';
import Property from '../models/Property.js';

// POST /api/inquiries/properties/:propertyId
// Creates a new inquiry from the authenticated buyer for the specified property.
// Returns the created inquiry document.
export const createInquiry = async (req, res) => {
  const property = await Property.findById(req.params.propertyId);
  if (!property) return res.status(404).json({ message: 'Property not found' });

  const inquiry = await Inquiry.create({
    property: property._id,
    buyer: req.user._id,
    message: req.body.message,
  });

  res.status(201).json(inquiry);
};

// GET /api/inquiries/properties/:propertyId
// Returns all inquiries for a given property, newest first.
// Accessible only to agents and sellers; buyer details are populated (name, email).
export const getForProperty = async (req, res) => {
  const inquiries = await Inquiry.find({ property: req.params.propertyId })
    .populate('buyer', 'name email')
    .sort({ createdAt: -1 });
  res.json(inquiries);
};

// GET /api/inquiries/my
// Returns all inquiries submitted by the authenticated buyer, newest first.
// Property title, price, and location are populated for context.
export const getForBuyer = async (req, res) => {
  const inquiries = await Inquiry.find({ buyer: req.user._id })
    .populate('property', 'title price location')
    .sort({ createdAt: -1 });
  res.json(inquiries);
};

// PATCH /api/inquiries/:id/reply
// Allows the listing agent to post a reply to an inquiry.
// Verifies the requesting user is the agent who owns the property; returns 403 otherwise.
// Sets status to 'replied' and saves the agent's reply text.
export const replyToInquiry = async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id).populate('property');
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

  if (inquiry.property.agent.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your inquiry' });
  }

  inquiry.agentReply = req.body.agentReply;
  inquiry.status = 'replied';
  await inquiry.save();
  res.json(inquiry);
};
