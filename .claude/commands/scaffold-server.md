---
description: Scaffold the complete Express backend with all models, controllers, routes, and RAG pipeline
allowed-tools: Bash, Write
---

You are a backend engineer. Create the full server/ directory structure for a MERN Real Estate App:

1. Run: cd server && npm init -y
2. Run: npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer
         cloudinary multer-storage-cloudinary @anthropic-ai/sdk
3. Run: npm install -D vitest supertest mongodb-memory-server nodemon @vitest/coverage-v8

4. Add to server/package.json scripts:
   "dev": "nodemon src/index.js"
   "start": "node src/index.js"
   "test": "vitest run"
   "test:unit": "vitest run --testPathPattern=unit"
   "test:coverage": "vitest run --coverage"

5. Create all files in this structure:
   server/src/
     config/db.js              — mongoose connect
     config/cloudinary.js      — cloudinary v2 config
     config/anthropic.js       — Anthropic SDK singleton: export { anthropic }
     models/User.js            — name, email, password, role (buyer/seller/agent),
                                  savedProperties[], timestamps
     models/Property.js        — title, description, price, bedrooms, bathrooms,
                                  propertyType (house/flat/studio/commercial),
                                  location{ address, city, postcode, lat, lng },
                                  images[]{url, caption, roomType},
                                  agent ref, status (active/archived/sold),
                                  aiDescription (string), aiValuation{},
                                  $text index on title+description+location.city
     models/Inquiry.js         — property ref, buyer ref, message,
                                  status (new/replied/closed), agentReply, createdAt
     models/DocumentChunk.js   — source (filename), section (heading),
                                  chunkIndex (number), content (string),
                                  wordCount (number), createdAt
     controllers/authController.js       — register, login
     controllers/propertyController.js   — getProperties, getById, createProperty,
                                            updateProperty, archiveProperty, searchProperties
     controllers/inquiryController.js    — createInquiry, getForProperty,
                                            getForBuyer, replyToInquiry
     controllers/aiController.js         — generateDescription, valuationInsights,
                                            analysePhotos, recommendProperties,
                                            nlSearch, ragChat
     routes/authRoutes.js
     routes/propertyRoutes.js
     routes/inquiryRoutes.js
     routes/aiRoutes.js
     middleware/authMiddleware.js         — JWT protect middleware
     middleware/roleMiddleware.js         — role guard: requireRole('agent')
     middleware/rateLimit.js             — 10 req/min per user for /api/ai/* routes
     scripts/ingestDocs.js               — reads server/src/data/company-docs/*.md,
                                            chunks into ~500-word blocks,
                                            upserts DocumentChunk collection
     data/company-docs/                  — 7 mock .md company document files
     index.js
   server/tests/
     unit/
     integration/
   server/.env.example  — ANTHROPIC_API_KEY, MONGODB_URI, JWT_SECRET,
                           CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
                           CLOUDINARY_API_SECRET

Output: ## Server scaffolded successfully — list all files created