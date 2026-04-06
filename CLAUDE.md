# Real Estate App — Meridian Realty Group

## Project Overview
Full-stack MERN property portal with AI-powered listings, photo analysis,
personalised recommendations, and a RAG chatbot trained on company documents.

## Architecture
- client/ — React 18 + Vite (port 5173), Tailwind CSS
- server/ — Node.js + Express REST API (port 5000)
- MongoDB Atlas — cloud database; DocumentChunk collection is the RAG store
- Cloudinary — property photo hosting
- Anthropic Claude API — six AI features (server-side only)
- RAG pipeline — no external vector DB; MongoDB $text search + Claude synthesis

## Key Commands
- Start backend:  cd server && npm run dev
- Start frontend: cd client && npm run dev
- Seed RAG docs:  cd server && node scripts/ingestDocs.js   (run once after first deploy)
- Run all tests:  npm test
- Run unit tests: npm run test:unit
- Build:          cd client && npm run build
- Deploy:         /deploy

## Code Style
- ES modules (import/export) throughout
- async/await over .then() chains
- Commit format: feat:, fix:, chore:, test:, docs:

## Testing Requirements
- All controllers: unit tests (mock Anthropic SDK and Cloudinary — never call real APIs in CI)
- All API routes: integration tests
- Critical flows: E2E tests
- Coverage target: 80% lines, 75% branches

## User Roles
- buyer  — can browse, save, inquire
- seller — can create listings (uses agent dashboard)
- agent  — can create/edit/archive listings, reply to inquiries

## Skills Available
- /create-user-stories <feature>
- /run-tests
- /unit-test-on-deploy
- /create-release-notes <tag>
- /deploy
- /check-coverage
- /scaffold-server
- /scaffold-client