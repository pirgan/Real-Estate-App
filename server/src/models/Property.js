import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    roomType: { type: String, default: 'other' },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postcode: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    propertyType: {
      type: String,
      enum: ['house', 'flat', 'studio', 'commercial'],
      required: true,
    },
    location: { type: locationSchema, required: true },
    images: [imageSchema],
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'archived', 'sold'], default: 'active' },
    aiDescription: { type: String, default: '' },
    aiValuation: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

propertySchema.index(
  { title: 'text', description: 'text', 'location.city': 'text' },
  { weights: { title: 3, 'location.city': 2, description: 1 } }
);

const Property = mongoose.model('Property', propertySchema);
export default Property;
