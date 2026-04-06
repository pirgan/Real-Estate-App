# Real Estate App — Complete Claude Code Guide
### Build a Full-Stack MERN App with AI, RAG Chatbot, Skills, Agents, Hooks, and MCP
*March 2026*

---

## Table of Contents

1. [What You Will Build](#1-what-you-will-build)
2. [Prerequisites](#2-prerequisites)
3. [Environment Setup](#3-environment-setup)
4. [Create All Skills First](#4-create-all-skills-first)
5. [Trello MCP Setup + Populate Backlog](#5-trello-mcp-setup)
6. [Configure Hooks](#6-configure-hooks)
7. [UI Prototype with Pencil MCP](#7-ui-prototype-with-pencil-mcp)
8. [Scaffold the Backend](#8-scaffold-the-backend)
9. [Scaffold the Frontend](#9-scaffold-the-frontend)
10. [Write the Comprehensive Test Suite](#10-write-the-comprehensive-test-suite)
11. [GitHub Actions CI/CD](#11-github-actions-cicd)
12. [The Feature Creation Workflow](#12-the-feature-creation-workflow)
13. [The Six AI Features](#13-the-six-ai-features)
14. [Push to GitHub](#14-push-to-github)
15. [Deploy to Vercel](#15-deploy-to-vercel)
16. [Release Tags and Notes](#16-release-tags-and-notes)
17. [Skills Deep Dive](#17-skills-deep-dive)
18. [Agents Deep Dive](#18-agents-deep-dive)
19. [Hooks Deep Dive](#19-hooks-deep-dive)
20. [Appendices](#20-appendices)

---

## 1. What You Will Build

A full-stack property portal for **Meridian Realty Group** — a fictional mid-size agency — where buyers browse and save listings, agents manage properties, and everyone can query a RAG-powered AI chatbot trained on the company's own documents.

*"Finding your place in the world."* — Meridian Realty Group

### Core Features

| Feature | Description |
|---------|-------------|
| Auth | JWT register, login, logout; three roles: Buyer, Seller, Agent |
| Property Listings | Create, view, edit, archive properties with title, price, bedrooms, type, location |
| Photo Upload | Multiple property photos via Cloudinary; AI-generated captions |
| Property Search | Full-text + advanced filters: price range, bedrooms, property type, city |
| Favorites | Buyers save properties; personalised AI recommendations from saved list |
| Inquiry / Contact | Buyers send inquiries to agents; agents reply and track status |
| Mortgage Calculator | Client-side monthly payment estimator (no API call needed) |
| Agent Dashboard | Manage own listings, view and reply to inquiries |
| **6 AI Features** | Claude-powered enhancements including RAG chatbot (see Part 13) |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite (port 5173) + Tailwind CSS |
| Backend | Node.js + Express REST API (port 5000) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| Images | Cloudinary |
| AI | Anthropic Claude API (server-side only) |
| RAG Store | MongoDB `DocumentChunk` collection (no external vector DB) |
| Unit Testing | Vitest + React Testing Library |
| Integration | Supertest + mongodb-memory-server |
| E2E | Playwright |
| CI/CD | GitHub Actions |
| Deployment | Vercel |

### Claude Code Features You Will Learn

| Feature | Used In | What It Does |
|---------|---------|--------------|
| Skills | Throughout | Custom slash commands for repetitive tasks |
| Agents | Part 18 | Autonomous sub-processes with scoped tools |
| Hooks | Part 19 | Auto-run shell commands on Claude Code events |
| MCP — Trello | Parts 5, 12 | Create and manage user stories from the terminal |
| MCP — Pencil | Part 7 | Generate UI prototypes with a single prompt |

---

## 2. Prerequisites

Before starting, verify you have everything installed:

```bash
node --version          # must be 18+
git --version
gh auth login           # GitHub CLI authenticated
vercel --version        # npm install -g vercel
```

You also need accounts on:
- **GitHub** — repository created
- **MongoDB Atlas** — free tier cluster URI ready
- **Cloudinary** — free tier API key and secret ready
- **Trello** — empty board named "Real Estate App"
- **Vercel** — account created

Install Claude Code:
```bash
npm install -g @anthropic-ai/claude-code
claude --version
claude auth login
```

---

## 3. Environment Setup

### Step 1 — Initialise the Repository

```bash
cd Real-Estate-App
git init
mkdir -p .claude/commands .claude/agents .github/workflows
```

Create `.gitignore` at the project root:
```
node_modules/
.env
dist/
.vercel/
.claude/activity.log
```

### Step 2 — Create CLAUDE.md

`CLAUDE.md` is the most important file in a Claude Code project. It gives Claude context about your project, commands, and expectations. Claude reads it automatically every session.

Create it at the project root:

```markdown
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
```

### Step 3 — Configure Permissions

Create `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(npx *)",
      "Bash(vercel *)",
      "Bash(gh *)",
      "Bash(node scripts/*)"
    ]
  }
}
```

### Step 4 — Open Claude Code

```bash
claude
```

Claude reads `CLAUDE.md` automatically. Type `/help` to see available skills.

---

## 4. Create All Skills First

> **Why first?** Skills automate everything that follows — scaffolding, testing, deployment. Create them once here and every subsequent step becomes a single command.

Skills are Markdown files in `.claude/commands/`. The exact format:

```markdown
---
description: One-line summary shown in /help
allowed-tools: Bash, Read, Write, Grep
argument-hint: <placeholder shown in CLI>
---

You are a [role]. When invoked with $ARGUMENTS, you must:
1. [Explicit step with exact commands]
2. [Step two]

Always output:
## Result
[structured output]
```

### Skill 1 — `/scaffold-server`

Create `.claude/commands/scaffold-server.md`:

```markdown
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
```

### Skill 2 — `/scaffold-client`

Create `.claude/commands/scaffold-client.md`:

```markdown
---
description: Scaffold the complete React + Vite + Tailwind frontend with all pages and components
allowed-tools: Bash, Write
---

You are a frontend engineer. Scaffold the full client/ directory for a MERN Real Estate App:

1. Run: npm create vite@latest client -- --template react
2. Run: cd client && npm install react-router-dom axios react-toastify
3. Run: npm install -D vitest @testing-library/react @testing-library/jest-dom
         @vitest/ui tailwindcss @tailwindcss/vite

4. Configure Tailwind in vite.config.js
5. Add to client/package.json scripts:
   "test": "vitest"
   "test:unit": "vitest run"
   "test:coverage": "vitest run --coverage"

6. Create all files in this structure:
   client/src/
     api/axios.js                — Axios instance with baseURL + auth header interceptor
     context/AuthContext.jsx
     components/
       Navbar.jsx
       PropertyCard.jsx          — card with photo, price badge, bedrooms, city, favorite button
       PropertyFilters.jsx       — sidebar: price range, bedrooms, type, city dropdowns
       ImageGallery.jsx          — lightbox-style photo viewer
       MortgageCalculator.jsx    — client-side calc: price, deposit, rate, term → monthly payment
       FavoriteButton.jsx        — heart icon toggle; calls PATCH /api/properties/:id/save
       InquiryForm.jsx           — textarea + send; calls POST /api/inquiries
       ProtectedRoute.jsx        — redirects to /login if not authenticated
       AgentRoute.jsx            — redirects if role !== 'agent'
       RagChatbot.jsx            — floating chat widget: button (bottom-right, gold),
                                   slide-in panel, conversation history, source citation pills,
                                   typing indicator, useSSE hook for streaming
       AIDescriptionGenerator.jsx — "Generate Description" button + streaming preview
     pages/
       Login.jsx
       Register.jsx
       Home.jsx                  — property grid + PropertyFilters sidebar
       PropertyDetail.jsx        — gallery, specs, MortgageCalculator, InquiryForm, AI panel
       CreateProperty.jsx        — 4-step form: basics → location → photos → publish
       EditProperty.jsx
       SearchResults.jsx         — NL search bar + filter chips + relevance badges
       SavedProperties.jsx       — buyer's favourites grid
       AgentDashboard.jsx        — listings table (status badges) + inquiries sidebar
       MyInquiries.jsx           — buyer's sent inquiries with reply thread
     hooks/
       useSSE.js                 — EventSource hook: append chunks, close on [DONE],
                                   expose { sources } from final [DONE] payload
   client/src/App.jsx            — BrowserRouter + all routes

Output: ## Client scaffolded successfully — list all files created
```

### Skill 3 — `/create-user-stories`

Create `.claude/commands/create-user-stories.md`:

```markdown
---
description: Generate Gherkin user stories and create Trello cards for a feature
allowed-tools: Bash
argument-hint: <feature description>
---

You are a product manager. When invoked with $ARGUMENTS:

1. Parse the feature into 3-5 user stories: "As a [role], I want [action], so that [benefit]"
2. Write Given/When/Then acceptance criteria for each story
3. Create a Trello card per story in the Backlog list with label "Story"

Output:
## Created Stories for: $ARGUMENTS

| # | Story | Trello Card |
|---|-------|-------------|
| 1 | As a... | [URL] |

## Acceptance Criteria
[Given/When/Then per story]
```

### Skill 4 — `/run-tests`

Create `.claude/commands/run-tests.md`:

```markdown
---
description: Run the full test suite (unit + integration + E2E) and report results
allowed-tools: Bash
---

Run the full test suite in sequence:

1. cd server && npm test -- --reporter=verbose
2. cd client && npm test -- --run --reporter=verbose
3. npx playwright test --reporter=list

Output:
## Test Results — [timestamp]

| Suite         | Passed | Failed | Skipped | Duration |
|---------------|--------|--------|---------|----------|
| Unit (server) | X      | X      | X       | Xs       |
| Unit (client) | X      | X      | X       | Xs       |
| Integration   | X      | X      | X       | Xs       |
| E2E           | X      | X      | X       | Xs       |

List each failure with file:line and error message.

Final status: PASS or FAIL

Exit with error code 1 if any failures > 0.
```

### Skill 5 — `/unit-test-on-deploy`

Create `.claude/commands/unit-test-on-deploy.md`:

```markdown
---
description: Run unit tests before deployment; block deploy if any fail
allowed-tools: Bash
---

1. cd server && npm run test:unit -- --run
2. cd client && npm run test:unit -- --run

If ALL pass output:
## Pre-Deploy Check: PASSED
- Server unit tests: X passed
- Client unit tests: X passed
- Proceeding with deployment...

If ANY fail output:
## Pre-Deploy Check: FAILED
- [test name] at [file:line]
- DEPLOYMENT BLOCKED. Fix failing tests before deploying.

Exit with code 1 to halt deployment on failure.
```

### Skill 6 — `/check-coverage`

Create `.claude/commands/check-coverage.md`:

```markdown
---
description: Run tests with coverage and flag files below 80% lines / 75% branches
allowed-tools: Bash
---

1. cd server && npm run test:coverage
2. cd client && npm run test:coverage

Flag any file where: line coverage < 80% OR branch coverage < 75%

Output:
## Coverage Report

| File                                | Lines | Branches | Status |
|-------------------------------------|-------|----------|--------|
| src/controllers/authController      | 92%   | 88%      | PASS   |
| src/controllers/aiController        | 65%   | 60%      | FAIL   |

For each FAIL: list the untested functions by name.
```

### Skill 7 — `/create-release-notes`

Create `.claude/commands/create-release-notes.md`:

```markdown
---
description: Generate release notes from git commits and create a GitHub Release
allowed-tools: Bash
argument-hint: <version tag e.g. v1.0.0>
---

1. git tag --sort=-version:refname | head -2   (get current and previous tag)
2. git log <prev>..<current> --oneline --no-merges
3. Categorise commits:
   - feat:  → New Features
   - fix:   → Bug Fixes
   - chore: → Maintenance
4. gh release create $ARGUMENTS --notes "..." --title "Release $ARGUMENTS"

Output the GitHub Release URL.
```

### Skill 8 — `/deploy`

Create `.claude/commands/deploy.md`:

```markdown
---
description: Run pre-deploy tests, build, deploy to Vercel production, and create a GitHub Release
allowed-tools: Bash
---

Step 1: cd server && npm run test:unit -- --run
        cd client && npm run test:unit -- --run
        If any fail: DEPLOYMENT BLOCKED — stop here.
Step 2: cd client && npm run build
Step 3: vercel --prod --confirm
Step 4: Capture deployment URL from vercel output
Step 5: TAG=$(git tag --sort=-version:refname | head -1)
        gh release create $TAG --generate-notes

Output:
## Deployment Complete
- URL:     [vercel URL]
- Release: [GitHub Release URL]
```

---

## 5. Trello MCP Setup

### Step 1 — Get Trello API Credentials

1. Go to https://trello.com/power-ups/admin
2. Click **New Power-Up** → name it "Claude Code Integration"
3. Copy your **API Key**
4. Click **Generate Token** → authorise → copy the **Token**

### Step 2 — Add to Claude Code MCP Config

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "YOUR_API_KEY_HERE",
        "TRELLO_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

> Never commit this file — it contains credentials.

### Step 3 — Verify and Set Up Board

In Claude Code chat:
```
Use the Trello MCP to create 4 lists on the Real Estate App board:
Backlog, In Progress, In Review, Done
```

### Step 4 — Populate the Backlog

Run each command; Claude creates Trello cards automatically:

```
/create-user-stories "User authentication — register, login, logout with buyer/seller/agent roles"
```

```
/create-user-stories "Property listings — create, view, edit, archive with title, price, bedrooms, type, location, photos"
```

```
/create-user-stories "Property search — full-text search plus filters for price, bedrooms, type, city, and availability"
```

```
/create-user-stories "Favorites and inquiries — buyers save properties, send inquiries to agents, agents reply"
```

```
/create-user-stories "Agent dashboard — manage own listings with status badges, view and reply to inquiries"
```

```
/create-user-stories "RAG chatbot — buyers and agents ask questions from company documents and get cited AI answers"
```

### How the Skill Works

```
/create-user-stories "RAG chatbot..."
       |
       Claude parses $ARGUMENTS
             |
             Generates 3-5 stories in "As a / I want / so that" format
             Writes Given/When/Then acceptance criteria per story
                   |
                   Calls Trello MCP tool: mcp__trello__add_card_to_list
                         |
                         Card created in Backlog with label "Story"
                         Returns Trello card URL
       |
       Output shown in Claude Code chat:
       ## Created Stories for: RAG chatbot...
       | # | Story | Trello Card |
       | 1 | As a buyer... | https://trello.com/c/... |
```

### Moving Cards via MCP

```
Move the RAG chatbot card to In Progress
```

```
Move the RAG chatbot cards to Done
```

Claude calls the Trello MCP and updates the card — no browser switching needed.

---

## 6. Configure Hooks

Hooks run shell commands **automatically** when specific Claude Code events happen. Configure them once here — they protect every push and automate every deploy for the rest of the project.

Update `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(npx *)",
      "Bash(vercel *)",
      "Bash(gh *)",
      "Bash(node scripts/*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git push*)",
        "hooks": [{
          "type": "command",
          "command": "cd \"$CLAUDE_PROJECT_DIR\" && npm run test:unit -- --run 2>&1; if [ $? -ne 0 ]; then echo 'BLOCKED: unit tests failed.' >&2; exit 2; fi"
        }]
      },
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "echo \"[$(date '+%Y-%m-%d %H:%M:%S')] WRITE: $CLAUDE_TOOL_INPUT_FILE_PATH\" >> \"$CLAUDE_PROJECT_DIR/.claude/activity.log\""
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash(vercel --prod*)",
        "hooks": [{
          "type": "command",
          "command": "cd \"$CLAUDE_PROJECT_DIR\" && TAG=$(git tag --sort=-version:refname | head -1) && PREV=$(git tag --sort=-version:refname | sed -n '2p') && echo \"## Release $TAG\" > /tmp/rn.md && git log $PREV..$TAG --oneline --no-merges >> /tmp/rn.md && gh release create $TAG --notes-file /tmp/rn.md --title \"Release $TAG\""
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "printf '\\a' && echo '[Claude Code] Task complete.'"
        }]
      }
    ]
  }
}
```

### What Each Hook Does

| Event | Matcher | What Happens | Blocks? |
|-------|---------|-------------|---------|
| `PreToolUse` | `git push*` | Runs unit tests silently | Yes — exit 2 |
| `PreToolUse` | `Write` | Logs file writes to `activity.log` | No |
| `PostToolUse` | `vercel --prod*` | Creates GitHub Release automatically | No |
| `Stop` | (all) | Terminal bell when Claude finishes | No |

---

## 7. UI Prototype with Pencil MCP

Pencil MCP is pre-configured in your environment. One structured prompt generates all UI screens — no manual design work needed.

### Step 1 — Create a New Design File

In Claude Code chat, say:
```
Use the Pencil MCP to create a new design file for the Meridian Real Estate App.
```

### Step 2 — Load the Style Guide

```
Get web-app design guidelines for a premium real estate portal with a clean, trustworthy look.
```

### Step 3 — Generate All Screens (One Prompt)

Paste this entire prompt into Claude Code chat:

```
Design a Real Estate web app for Meridian Realty Group with exactly 7 screens:

Screen 1 — Login/Register:
Centered card, tab switcher Login/Register, email + password fields,
role selector dropdown (Buyer / Seller / Agent), primary CTA button.

Screen 2 — Home / Property Grid:
Navbar (logo left, search bar center, avatar + saved-count badge right),
left sidebar with PropertyFilters (price slider, bedrooms stepper,
property type checkboxes, city dropdown), right: masonry grid of PropertyCards
(hero photo, price badge top-left, title, city, bedrooms/bathrooms row,
heart FavoriteButton top-right), floating gold chat bubble bottom-right (RAG chatbot).

Screen 3 — Property Detail:
Full-width ImageGallery (5 thumbnails strip below hero), property title H1,
price H2 gold, location with map-pin icon, specs row (beds/baths/sqft/type),
"AI Insights" collapsible panel (valuation verdict + market comment),
MortgageCalculator card (inputs: deposit %, rate %, term), InquiryForm card,
"Generate Description" button for agents.

Screen 4 — Create / Edit Property (multi-step):
Step indicator 1/4 2/4 3/4 4/4.
Step 1: title, property type, bedrooms, bathrooms, price.
Step 2: address, city, postcode.
Step 3: photo upload grid (up to 8 slots, AI caption generated per photo).
Step 4: review card + "Generate AI Description" button + Publish.

Screen 5 — Search Results:
Navbar with pre-filled NL search bar ("3 bed near good schools under £400k"),
active filter chips row (removable), results grid with relevance badges
(Exact / Strong / Partial), empty state with illustrated house + retry prompt.

Screen 6 — Agent Dashboard:
Sidebar nav (My Listings, Inquiries, Analytics), main area: listings table
(photo thumbnail, title, status badge Active/Archived/Sold, price, inquiry count,
Edit + Archive actions), inquiries panel (list of messages with buyer name,
property thumbnail, status, Reply button).

Screen 7 — RAG Chatbot Panel (slide-in overlay):
Triggered by gold chat bubble. Right-side panel (400px wide).
Header: "Meridian Assistant" + Meridian logo small + X close.
Chat messages: user bubbles (navy, right), AI bubbles (white card, left).
Source citation pills below each AI message (e.g. "buyer-guide.md" tag).
Typing indicator (3 animated dots) while streaming.
Input bar at bottom with send button. Placeholder: "Ask about buying,
selling, mortgages, or local area guides..."

Colors: navy #1B3A5C, gold #C9A84C, white #FFFFFF, light gray #F5F5F5.
Typography: Playfair Display headings, Inter body.
```

Claude calls `batch_design` and generates all 7 screens automatically.

### Step 4 — Review and Export

```
Take a screenshot of all designed screens.
```

For fixes, say: `On Screen 7, make the AI chat bubbles wider.`

```
Export all 7 screens as PNG to client/src/design-reference/
```

> **Key lesson:** One structured prompt = complete prototype. Manual tweaks only for refinements.

---

## 8. Scaffold the Backend

Now use the skill you created in Part 4:

```
/scaffold-server
```

Claude creates the entire `server/` directory — all models, controllers, routes, middleware, scripts, and test folders — in one go.

### Verify the Structure

After the skill completes, your `server/` should look like:

```
server/
  src/
    config/
      db.js
      cloudinary.js
      anthropic.js              <- Anthropic SDK singleton
    controllers/
      authController.js
      propertyController.js
      inquiryController.js
      aiController.js           <- all 6 AI endpoints including ragChat
    middleware/
      authMiddleware.js
      roleMiddleware.js         <- requireRole('agent') guard
      rateLimit.js              <- 10 req/min per user
    models/
      User.js
      Property.js
      Inquiry.js
      DocumentChunk.js          <- RAG document store
    routes/
      authRoutes.js
      propertyRoutes.js
      inquiryRoutes.js
      aiRoutes.js
    scripts/
      ingestDocs.js             <- run once to seed DocumentChunk collection
    data/
      company-docs/             <- 7 mock .md files (see Appendix C)
        buyer-guide.md
        seller-guide.md
        mortgage-guide.md
        area-guide-city-centre.md
        area-guide-greenwich-park.md
        investment-guide.md
        faq.md
    index.js
  tests/
    unit/
    integration/
  .env.example
  package.json
```

### Create `server/.env`

```env
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=generate-with-crypto-randomBytes-64
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

> `.env` is in `.gitignore` — never commit it.

### Seed the RAG Document Store

After the server is scaffolded and `.env` is filled in, seed the `DocumentChunk` collection once:

```bash
cd server && node src/scripts/ingestDocs.js
```

Expected output:
```
Connecting to MongoDB...
Processing buyer-guide.md — 6 chunks created
Processing seller-guide.md — 5 chunks created
Processing mortgage-guide.md — 7 chunks created
Processing area-guide-city-centre.md — 4 chunks created
Processing area-guide-greenwich-park.md — 4 chunks created
Processing investment-guide.md — 5 chunks created
Processing faq.md — 8 chunks created
Total: 39 DocumentChunks seeded. RAG store ready.
```

---

## 9. Scaffold the Frontend

```
/scaffold-client
```

Claude creates the entire `client/` directory — all pages, components, hooks, and config.

### Verify the Structure

```
client/
  src/
    api/
      axios.js              <- Axios instance with auth interceptor
    context/
      AuthContext.jsx
    components/
      Navbar.jsx
      PropertyCard.jsx
      PropertyFilters.jsx
      ImageGallery.jsx
      MortgageCalculator.jsx
      FavoriteButton.jsx
      InquiryForm.jsx
      ProtectedRoute.jsx
      AgentRoute.jsx
      RagChatbot.jsx        <- persistent floating widget across all pages
      AIDescriptionGenerator.jsx
    pages/
      Login.jsx
      Register.jsx
      Home.jsx
      PropertyDetail.jsx
      CreateProperty.jsx
      EditProperty.jsx
      SearchResults.jsx
      SavedProperties.jsx
      AgentDashboard.jsx
      MyInquiries.jsx
    hooks/
      useSSE.js
    App.jsx
  design-reference/
  package.json
  vite.config.js
```

---

## 10. Write the Comprehensive Test Suite

> **Important distinction:**
>
> - **This section** = Claude Code writes the test **files** to disk (done once per layer)
> - **`/run-tests` skill** = executes those files and reports results (done repeatedly, any time)
>
> They never overlap. One writes, one runs.

### How to Create the Tests

Paste each prompt below into Claude Code chat **once**, in order. Wait for Claude to confirm files are written before moving to the next prompt.

---

### 10.1 — Backend Unit Tests

Paste this prompt into Claude Code:

```
Write comprehensive Vitest unit tests in server/tests/unit/.
Mock ALL external dependencies (mongoose models, Anthropic SDK, Cloudinary, bcryptjs, jsonwebtoken).
Never call the real Anthropic API — always vi.mock() it.

Create authController.test.js with these cases:
- register: 201 + token on success
- register: 409 on duplicate email
- register: 400 on missing fields
- register: bcrypt.hash called with 10 rounds
- register: JWT payload contains { id, email, role }
- login: 200 + token on valid credentials
- login: 401 on wrong password
- login: 404 on unknown email

Create propertyController.test.js with these cases:
- getProperties: returns only active listings
- getProperties: populates agent field
- createProperty: 201 + property saved to DB (agent role)
- createProperty: 403 when role is not agent
- updateProperty: agent can update own listing
- updateProperty: 403 when updating another agent's listing
- archiveProperty: sets status to 'archived'
- searchProperties: $text search returns matching results

Create inquiryController.test.js with these cases:
- createInquiry: 201 + saved with status 'new'
- createInquiry: 404 when property not found
- replyToInquiry: agent can reply (status → 'replied')
- replyToInquiry: 403 when buyer tries to reply
- getForProperty: 403 for non-owning agent

Create aiController.test.js with these cases (ALL mock Anthropic SDK):
- generateDescription: sets SSE headers, streams chunks, emits [DONE]
- valuationInsights: returns cached aiValuation if present
- valuationInsights: calls Anthropic when no cache, saves result to Property
- analysePhotos: processes images in batches of 3
- analysePhotos: saves caption + roomType to Property.images[n]
- recommendProperties: returns 5 matching properties
- nlSearch: parses JSON intent, builds MongoDB query
- ragChat: calls keyword extractor (haiku), retrieves chunks, calls synthesiser (sonnet)
- ragChat: includes sources array in [DONE] event
- ragChat: returns 404 when no chunks found for query
```

Wait for Claude to write the files.

---

### 10.2 — Frontend Unit Tests

Paste this prompt into Claude Code:

```
Write Vitest + React Testing Library tests in client/src/.

Login.test.jsx:
- Renders email and password inputs
- Shows validation error when fields are empty on submit
- Calls POST /api/auth/login with correct payload
- Navigates to / on success

Register.test.jsx:
- Renders name, email, password, role selector inputs
- Role dropdown contains Buyer, Seller, Agent options

PropertyCard.test.jsx:
- Renders title, price, city, bedrooms count
- FavoriteButton toggles heart fill on click
- Clicking card navigates to /property/:id

MortgageCalculator.test.jsx:
- Calculates correct monthly payment for given inputs
  (£300,000 price, 10% deposit, 3.5% rate, 25 years → ~£1,337/month)
- Updates result when any input changes

InquiryForm.test.jsx:
- Textarea accepts input
- Submit button disabled when textarea is empty
- Calls POST /api/inquiries on submit with correct propertyId

RagChatbot.test.jsx:
- Chat bubble button renders in DOM
- Clicking button opens the chatbot panel
- Typing a question and submitting shows the message in chat
- Source citation pills appear after AI response renders
- Closing panel hides it
```

Wait for Claude to write the files.

---

### 10.3 — Integration Tests

Paste this prompt into Claude Code:

```
Write Supertest integration tests in server/tests/integration/.
Use mongodb-memory-server for an in-memory DB. Mock Anthropic SDK and Cloudinary.

auth.integration.test.js:
- POST /api/auth/register: 201 + token
- POST /api/auth/register: 409 on duplicate email
- POST /api/auth/login: 200 + token
- POST /api/auth/login: 401 on bad password

properties.integration.test.js:
- GET /api/properties: 200 + array of active listings
- GET /api/properties/:id: 200 + single property
- POST /api/properties: 401 without token
- POST /api/properties: 403 when role is buyer
- POST /api/properties: 201 when role is agent
- PATCH /api/properties/:id: 200 for owning agent
- PATCH /api/properties/:id/archive: sets status archived

inquiries.integration.test.js:
- POST /api/inquiries: 401 without token
- POST /api/inquiries: 201 + status 'new' with valid token
- PATCH /api/inquiries/:id/reply: 403 for non-agent
- PATCH /api/inquiries/:id/reply: 200 + status 'replied' for agent
- GET /api/properties/:id/inquiries: 200 for owning agent

ai.integration.test.js (mock Anthropic SDK):
- POST /api/ai/generate-description: text/event-stream content-type set
- POST /api/ai/valuation-insights: 200 + JSON object
- POST /api/ai/nl-search: 200 + array of matched properties
- All /api/ai/* routes: 429 after 10 requests per minute
- All /api/ai/* routes: 401 without auth token

rag.integration.test.js (mock Anthropic SDK, seed 3 DocumentChunks):
- POST /api/ai/rag-chat: 401 without token
- POST /api/ai/rag-chat: sets text/event-stream headers
- POST /api/ai/rag-chat: keyword extractor called first (haiku)
- POST /api/ai/rag-chat: [DONE] event includes sources array
- POST /api/ai/rag-chat: streams "no information found" when 0 chunks match
```

Wait for Claude to write the files.

---

### 10.4 — E2E Tests (Playwright)

First, install Playwright:

```bash
npm init playwright@latest
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: [
    { command: 'npm run dev', cwd: './server', port: 5000 },
    { command: 'npm run dev', cwd: './client', port: 5173, reuseExistingServer: true }
  ]
});
```

Then paste this prompt into Claude Code:

```
Write Playwright E2E tests in e2e/.

auth.spec.ts:
- User can register as Buyer and lands on Home page
- User sees error on duplicate email registration
- User can log in with existing credentials
- Unauthenticated user redirected to /login

properties.spec.ts:
- Agent can create a new property (fill all 4 steps, publish)
- Created property appears on Home grid
- User can open Property Detail page
- MortgageCalculator updates monthly payment on input change
- Agent can edit property details
- Agent can archive property — card disappears from Home

inquiries.spec.ts:
- Buyer can send inquiry on Property Detail page
- Inquiry appears in Agent Dashboard inquiries list
- Agent can reply to inquiry — status updates to "replied"
- Buyer can see agent reply in My Inquiries page

search.spec.ts:
- Typing in search bar filters property cards
- Price filter hides properties above maximum
- Bedrooms filter shows only matching results
- Clearing all filters restores full grid

rag.spec.ts (use Playwright route interception to mock AI responses):
- Clicking gold chat bubble opens chatbot panel
- Typing "What is the buying process?" and sending shows user message
- Mock SSE response streams into AI bubble
- Source citation pills appear ("buyer-guide.md")
- Closing panel hides it; reopening preserves conversation history
```

Wait for Claude to write the files.

---

### Summary: Write Once, Run Many Times

| When | What you do | What Claude Code does |
|------|------------|----------------------|
| After `/scaffold-server` | Paste 10.1 prompt | Writes `server/tests/unit/*.test.js` |
| After `/scaffold-client` | Paste 10.2 prompt | Writes `client/src/**/*.test.jsx` |
| After both scaffolded | Paste 10.3 prompt | Writes `server/tests/integration/*.test.js` |
| After all above | Paste 10.4 prompt | Writes `e2e/*.spec.ts` |

Once written, these files live in your repo permanently. To run them at any time:

```
/run-tests
```

---

## 11. GitHub Actions CI/CD

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install server deps
        run: cd server && npm ci

      - name: Install client deps
        run: cd client && npm ci

      - name: Server unit tests
        run: cd server && npm run test:unit
        env:
          JWT_SECRET: test-secret-for-ci

      - name: Client unit tests
        run: cd client && npm test -- --run

      - name: Integration tests
        run: cd server && npm test
        env:
          JWT_SECRET: test-secret-for-ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        run: npx playwright test
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
          CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
```

### GitHub Secrets to Add

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | How to generate |
|--------|----------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |

> **Never add `ANTHROPIC_API_KEY` to GitHub Secrets.** The real API is never called in CI — all Anthropic SDK calls are mocked in tests.

### Branch Protection

Settings → Branches → Add rule for `main`:
- Require status checks to pass: **CI / test**
- Require branches to be up to date before merging

### Test with a Pull Request

```bash
git checkout -b feature/initial-setup
git add .
git commit -m "feat: initial MERN app setup with RAG and tests"
git push origin feature/initial-setup
gh pr create --title "Initial MERN app setup" --body "Adds server, client, RAG pipeline, and test infrastructure"
```

---

## 12. The Feature Creation Workflow

Every new feature follows this exact loop — **in this order**:

```
1. /create-user-stories <feature>      SKILL  — once per feature
      |
      Wait for Trello cards to be created
      |
2. [backend prompt] to Claude Code     PROMPT — once per feature
      |
      Wait for controller + route files to be written
      |
3. [frontend prompt] to Claude Code    PROMPT — once per feature
      |
      Wait for component files to be written
      |
4. /run-tests                          SKILL  — repeat until green
      |
      Fix failures by describing to Claude, then repeat step 4
      |
5. /check-coverage                     SKILL  — once before push
      |
6. commit and push                     MANUAL or Claude Code chat
      |
      Hook fires automatically: unit tests gate
      Push blocked if red, proceeds if green
      |
7. /deploy                             SKILL  — once per release
      |
      Tests -> build -> Vercel -> GitHub Release
```

### How Many Prompts Per Feature?

**3 separate prompts, in order** — not all at once:

| Prompt | What you type | Why separate |
|--------|--------------|-------------|
| 1 — User Stories | `/create-user-stories "..."` | Skill must complete; sets acceptance criteria |
| 2 — Backend | `Create POST /api/...` | Defines the API contract the frontend will consume |
| 3 — Frontend | `Create client/src/components/...` | Depends on the exact API shape from Prompt 2 |

> If you send backend + frontend at once, Claude guesses the API contract and often gets it wrong.
>
> **Exception:** You can combine Prompts 2 + 3 if you explicitly define the full request/response contract in one message.

### What Is a Skill vs a Plain Prompt?

| Action | Type | Frequency |
|--------|------|-----------|
| Scaffold folders/files | Skill (`/scaffold-*`) | **Once ever** |
| Seed RAG document store | `node scripts/ingestDocs.js` | **Once after first deploy** |
| Write test files (Part 10) | Plain Claude prompt | **Once per layer** |
| Create Trello stories | Skill (`/create-user-stories`) | **Once per feature** |
| Write backend code | Plain Claude prompt | **Once per feature** |
| Write frontend code | Plain Claude prompt | **Once per feature** |
| Run tests | Skill (`/run-tests`) | **Many times** during dev |
| Check coverage | Skill (`/check-coverage`) | Once before deploy |
| Commit + push | Manual or Claude Code chat | After every feature |
| Deploy | Skill (`/deploy`) | Once per release |
| Release notes | Skill (`/create-release-notes`) | Once per tag |

### Automatic Steps — Zero Invocation Needed

| Trigger | What Happens Automatically |
|---------|--------------------------|
| `git push` | Unit tests run; push blocked if red |
| `vercel --prod` | GitHub Release created |
| Claude finishes any task | Terminal bell rings |

---

## 13. The Six AI Features

### AI Model Selection

| Task | Model |
|------|-------|
| Fast tasks (JSON extraction, streaming prose) | `claude-3-5-haiku-20241022` |
| Vision, long-form synthesis, RAG answer generation | `claude-3-5-sonnet-20241022` |

> `ANTHROPIC_API_KEY` is **server-only** — never expose it to the React client.

### SDK Patterns

**JSON mode:**
```javascript
system: 'Return ONLY valid JSON. No markdown.'
// then: JSON.parse(msg.content[0].text)
```

**Streaming:**
```javascript
anthropic.messages.stream(...)
// emit:  data: ${JSON.stringify({ chunk })}\n\n
// end:   data: [DONE]\n\n
```

**Vision:**
```javascript
{ type: 'image', source: { type: 'url', url: cloudinaryUrl } }
```

**Batch (groups of 3–5):**
```javascript
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  await Promise.all(items.slice(i, i + BATCH_SIZE).map(fn));
}
```

**React SSE consumer (useSSE hook):**
```javascript
// Open EventSource; append chunks; on [DONE] close + extract sources
```

---

### Feature 1 — AI Property Description Generator (Streaming)

**Endpoint:** `POST /api/ai/generate-description` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "AI Property Description Generator — agent fills in property basics
and Claude streams a polished marketing description into a preview pane,
with Accept and Discard controls"
```

**Backend prompt (send separately, wait for files):**
```
Create POST /api/ai/generate-description in server/src/controllers/aiController.js.
Accept { title, bedrooms, bathrooms, propertyType, location, price, highlights[] } in req.body.
Protect with authMiddleware + requireRole('agent') + aiRateLimit.
Set SSE headers: Content-Type text/event-stream, Cache-Control no-cache, Connection keep-alive.
Call claude-3-5-haiku-20241022 with anthropic.messages.stream().
System: "You are a property marketing copywriter. Write compelling, factual property
descriptions. 2-3 paragraphs. No emojis."
On each text delta: res.write("data: " + JSON.stringify({ chunk: text }) + "\n\n").
On stream end: res.write("data: [DONE]\n\n") then res.end().
```

**Frontend prompt (send separately after backend is written):**
```
Create client/src/components/AIDescriptionGenerator.jsx.
Props: { propertyData, onAccept }.
Show "Generate Description" button (agent-only, check AuthContext role).
On click, open EventSource to POST /api/ai/generate-description using useSSE hook.
Append each chunk to a preview textarea incrementally.
Show animated typing cursor during streaming.
On [DONE]: show "Accept" and "Discard" buttons.
"Accept" calls onAccept(generatedText) to update the form's description field.
Place in CreateProperty.jsx Step 1 below the description textarea.
```

---

### Feature 2 — Smart Valuation Insights (JSON + Cache)

**Endpoint:** `POST /api/ai/valuation-insights` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "Smart Valuation Insights — when a property is viewed, Claude analyses
its price against local market data and returns a verdict, investment score, and comparable range,
cached in the Property document so the API is only called once"
```

**Backend prompt:**
```
Create POST /api/ai/valuation-insights in aiController.js.
Accept { propertyId } in req.body. Protect with authMiddleware + aiRateLimit.
Fetch Property by ID. If Property.aiValuation exists and is not empty, return it immediately (cache hit).
Otherwise call claude-3-5-haiku-20241022 with JSON mode.
System: 'Return ONLY valid JSON. No markdown.'
User prompt: include price, bedrooms, propertyType, city from the Property document.
Expected JSON: { pricePerSqft, marketComment, investmentScore (1-10), comparableRange: { min, max }, verdict }
Parse JSON, save to Property.aiValuation, return it.
```

**Frontend prompt:**
```
Create a ValuationInsights collapsible card in PropertyDetail.jsx.
On page mount, call POST /api/ai/valuation-insights with the propertyId.
Show a loading skeleton while fetching.
Expanded view: investmentScore as a coloured badge (1-4 red, 5-7 amber, 8-10 green),
verdict text, marketComment paragraph, comparableRange as "£X – £Y" range.
Collapse toggle with chevron icon.
```

---

### Feature 3 — AI Photo Analyser (Vision + Batch)

**Endpoint:** `POST /api/ai/analyse-photos` | **Model:** `claude-3-5-sonnet-20241022`

```
/create-user-stories "AI Photo Analyser — after photos are uploaded to Cloudinary, Claude Vision
analyses each image and generates a caption and room type label, stored with the photo
and displayed in the ImageGallery"
```

**Backend prompt:**
```
Create POST /api/ai/analyse-photos in aiController.js.
Accept { propertyId } in req.body. Protect with authMiddleware + requireRole('agent') + aiRateLimit.
Fetch Property by ID. Filter images that have no caption yet.
Process in batches of 3 using Promise.all.
For each image: call claude-3-5-sonnet-20241022 with vision.
  Content block: { type: 'image', source: { type: 'url', url: image.url } }
  Text block: 'Describe this property photo.'
  System: 'Return ONLY JSON: { caption: string (max 15 words), roomType: string, condition: string }'
Parse JSON, update Property.images[n].caption and Property.images[n].roomType.
Return updated images array.
```

**Frontend prompt:**
```
After Step 3 photo upload in CreateProperty.jsx completes,
automatically call POST /api/ai/analyse-photos.
Show a "Analysing photos..." spinner overlay on the upload grid.
When complete, show each generated caption below its thumbnail in italic Inter 12px.
Show a room type chip (e.g. "Kitchen", "Living Room") as a badge top-left of each thumbnail.
In ImageGallery.jsx on PropertyDetail, display caption below each full image.
```

---

### Feature 4 — Personalised Property Recommendations (Batch)

**Endpoint:** `POST /api/ai/recommend-properties` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "Personalised Property Recommendations — Claude analyses the buyer's
saved properties to infer preferences, then returns 5 matching recommendations from the database"
```

**Backend prompt:**
```
Create POST /api/ai/recommend-properties in aiController.js.
Protect with authMiddleware + aiRateLimit.
Fetch the logged-in user's savedProperties (populated: title, bedrooms, propertyType, price, location.city).
If fewer than 2 saved properties, return 400: "Save at least 2 properties to get recommendations."
Call claude-3-5-haiku-20241022 with JSON mode.
System: 'Return ONLY valid JSON. No markdown.'
Prompt: summarise the saved properties; ask Claude to infer:
  { preferredBedrooms: number, preferredType: string, preferredAreas: string[],
    maxBudget: number, explanation: string }
Parse JSON. Build MongoDB query: bedrooms === preferredBedrooms, propertyType === preferredType,
price <= maxBudget, city $in preferredAreas, status 'active'.
Exclude already-saved property IDs. Limit 5.
Return { recommendations: Property[], explanation }.
```

**Frontend prompt:**
```
Create client/src/pages/SavedProperties.jsx.
Show saved properties grid at the top.
Below: "Recommended For You" section.
On mount, call POST /api/ai/recommend-properties.
Show explanation text from Claude in italic below the section heading.
Render up to 5 PropertyCards with "Recommended" badge top-left.
Show empty state if fewer than 2 properties are saved.
```

---

### Feature 5 — Natural Language Property Search (JSON Intent Parsing)

**Endpoint:** `POST /api/ai/nl-search` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "Natural Language Property Search — buyers type intent-based queries
like '3-bed near good schools under £400k', Claude extracts structured filters,
and results are returned ranked by relevance with a toggle between AI and keyword mode"
```

**Backend prompt:**
```
Create POST /api/ai/nl-search in aiController.js.
Accept { query: string } in req.body. Protect with authMiddleware + aiRateLimit.
Call claude-3-5-haiku-20241022 with JSON mode.
System: 'Return ONLY valid JSON. No markdown.'
Prompt: extract search intent from the natural language query.
Expected JSON: { bedrooms: number|null, maxPrice: number|null, minPrice: number|null,
  propertyType: string|null, cities: string[], keywords: string[], explanation: string }
Parse JSON. Build MongoDB query from extracted fields.
Use $text search with keywords if present.
Return { properties: Property[], filters: extractedJSON } sorted by textScore descending.
```

**Frontend prompt:**
```
In Navbar.jsx add an "AI" sparkle toggle button beside the search input.
When AI mode active: border glows gold, placeholder changes to "Describe your ideal home..."
On search submit in AI mode: call POST /api/ai/nl-search instead of regular search.
In SearchResults.jsx: show extracted filter chips from response.filters (removable).
Each PropertyCard shows a relevance badge: Exact / Strong / Partial based on match quality.
Empty state: "No properties matched. Try different words." with "Switch to keyword search" link.
```

---

### Feature 6 — RAG Company Document Chatbot ⭐

**Endpoint:** `POST /api/ai/rag-chat` | **Model:** `claude-3-5-haiku-20241022` (keyword extraction) + `claude-3-5-sonnet-20241022` (answer synthesis)

```
/create-user-stories "RAG Company Document Chatbot — users ask natural language questions
and Claude answers using only Meridian Realty's company documents, with source citations
shown as clickable pills below each AI response"
```

This is the architectural centrepiece of the app. It involves two Claude calls per query and a MongoDB-backed document store — no external vector database required.

---

#### Step A — Document Ingestion (`scripts/ingestDocs.js`, run once)

**How ingestDocs.js works:**

```javascript
// server/src/scripts/ingestDocs.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import DocumentChunk from '../models/DocumentChunk.js';
import { config } from 'dotenv';

config();

const DOCS_DIR = path.join(import.meta.dirname, '../data/company-docs');
const CHUNK_WORD_TARGET = 500; // aim for ~500 words per chunk

function chunkText(text, source) {
  // Split on double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = '';
  let chunkIndex = 0;
  let currentSection = '';

  for (const para of paragraphs) {
    // Detect heading (starts with #)
    if (para.startsWith('#')) {
      currentSection = para.replace(/^#+\s*/, '').trim();
    }
    // If adding this paragraph exceeds target, flush current chunk
    const wordCount = (current + para).split(/\s+/).length;
    if (wordCount > CHUNK_WORD_TARGET && current.length > 0) {
      chunks.push({ content: current.trim(), section: currentSection, chunkIndex });
      chunkIndex++;
      current = para + '\n\n';
    } else {
      current += para + '\n\n';
    }
  }
  if (current.trim()) {
    chunks.push({ content: current.trim(), section: currentSection, chunkIndex });
  }
  return chunks.map(c => ({ ...c, source, wordCount: c.content.split(/\s+/).length }));
}

async function ingest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const text = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');
    const chunks = chunkText(text, file);
    await DocumentChunk.deleteMany({ source: file }); // idempotent re-run
    await DocumentChunk.insertMany(chunks);
    console.log(`${file} — ${chunks.length} chunks created`);
  }
  await mongoose.disconnect();
  console.log('Done. RAG store ready.');
}

ingest().catch(console.error);
```

Run it:
```bash
cd server && node src/scripts/ingestDocs.js
```

**Add a text index to DocumentChunk** (in the model):
```javascript
documentChunkSchema.index({ content: 'text', section: 'text' });
```

---

#### Step B — Query Processing (at runtime, per user message)

**Backend prompt:**
```
Create POST /api/ai/rag-chat in aiController.js.
Accept { question: string, history: Array<{role,content}> } in req.body.
Protect with authMiddleware + aiRateLimit.
Set SSE headers for streaming.

Step 1 — Keyword extraction (haiku, JSON mode):
  Call claude-3-5-haiku-20241022.
  System: 'Return ONLY valid JSON. No markdown.'
  Prompt: 'Extract 3-5 search keywords from this question: "${question}"'
  Expected JSON: { keywords: string[] }
  Parse keywords.

Step 2 — Chunk retrieval (MongoDB):
  const chunks = await DocumentChunk
    .find({ $text: { $search: keywords.join(' ') } },
           { score: { $meta: 'textScore' }, content: 1, source: 1, section: 1 })
    .sort({ score: { $meta: 'textScore' } })
    .limit(5);

  If chunks.length === 0:
    stream "I could not find relevant information in Meridian Realty's documents
            for that question. Please contact our team directly."
    end with data: [DONE]\n\n
    return.

Step 3 — Build context string:
  const context = chunks.map(c =>
    `---\nSOURCE: ${c.source}\nSECTION: ${c.section}\n${c.content}\n---`
  ).join('\n\n');

Step 4 — Answer synthesis (sonnet, streaming):
  const stream = anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 600,
    system: `You are the Meridian Realty Group assistant. Answer questions ONLY using
             the provided document excerpts. If the answer is not in the documents,
             say so clearly. Always cite which document your answer comes from.
             Be concise, helpful, and professional.`,
    messages: [
      ...history,
      { role: 'user', content: `<context>\n${context}\n</context>\n\nQuestion: ${question}` }
    ],
  });

  const sources = [...new Set(chunks.map(c => c.source))];

  stream.on('text', chunk => res.write(`data: ${JSON.stringify({ chunk })}\n\n`));
  stream.on('end', () => {
    res.write(`data: ${JSON.stringify({ type: '[DONE]', sources })}\n\n`);
    res.end();
  });
  stream.on('error', err =>
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
  );
```

**Frontend prompt:**
```
Create client/src/components/RagChatbot.jsx.

State: isOpen (boolean), messages (array of {role, content, sources}), input (string).

Render:
1. A fixed gold chat bubble button (bottom-right, z-50).
   Shows unread indicator dot when closed.
2. A slide-in panel (right side, w-96, full-height, shadow-xl).
   Header: "Meridian Assistant" logo + X close button.
   Messages area (scrollable): user bubbles (navy bg, white text, right-aligned),
   AI bubbles (white card, navy text, left-aligned).
   Below each AI bubble: source citation pills — small rounded tags showing
   the filename (e.g. "buyer-guide.md"), gold border, truncated if long.
   Typing indicator (3 animated dots pulse) while streaming.
   Input bar at bottom: textarea (auto-grow) + gold Send button.
   Placeholder: "Ask about buying, selling, mortgages, or local area guides..."

On send:
  Append user message to messages array.
  Open EventSource to POST /api/ai/rag-chat using useSSE hook.
  Append each { chunk } to the last AI message incrementally.
  On { type: '[DONE]', sources }: set sources on the last AI message, close EventSource.
  On { error }: show error toast.

useSSE.js extension needed:
  The hook must parse the final [DONE] event to extract sources
  and return them alongside the streamed text.

Mount RagChatbot in App.jsx outside the <Routes> so it persists across all pages.
```

---

## 14. Push to GitHub

```bash
git add .
git commit -m "feat: initial MERN real estate app with RAG chatbot and AI features"
git push origin main
```

The `PreToolUse` hook fires automatically before the push. Unit tests run silently. If they pass, the push proceeds. If they fail, the push is blocked:

```
BLOCKED: unit tests failed.
```

Fix the failing tests (Claude Code will tell you exactly which ones), then push again.

---

## 15. Deploy to Vercel

### Step 1 — Login

```bash
npm install -g vercel
vercel login
```

### Step 2 — Create `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "server/src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server/src/index.js" },
    { "src": "/(.*)",     "dest": "/client/dist/$1" }
  ]
}
```

### Step 3 — Set Environment Variables

In Vercel dashboard: **Project → Settings → Environment Variables**

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 64-byte hex string |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (Vercel only — never CI) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `VITE_API_URL` | `https://your-project.vercel.app/api` |

### Step 4 — Run Pre-Deploy Check

```
/unit-test-on-deploy
```

If PASSED, proceed. If FAILED, fix tests first.

### Step 5 — Deploy

```
/deploy
```

This runs: unit tests → client build → `vercel --prod` → GitHub Release (via hook).

### Step 6 — Seed the RAG Store on Production

After the first successful deployment, run the ingestion script against your production MongoDB URI:

```bash
MONGODB_URI=mongodb+srv://... node server/src/scripts/ingestDocs.js
```

Or set `MONGODB_URI` in your local `.env` pointing to Atlas and run locally — the chunks will persist in the cloud database.

### Step 7 — Verify

```bash
vercel ls
```

Open the deployment URL, log in as a Buyer, click the gold chat bubble, and ask:
```
What is the buying process at Meridian Realty?
```

The chatbot should stream an answer citing `buyer-guide.md`.

---

## 16. Release Tags and Notes

### Create a Tag

```bash
git tag -a v1.0.0 -m "First release: property listings, search, RAG chatbot, 6 AI features"
git push origin v1.0.0
```

### Run the Skill

```
/create-release-notes v1.0.0
```

Claude reads the git log, categorises commits, and creates a GitHub Release at:
`github.com/youruser/real-estate-app/releases/tag/v1.0.0`

> The `/deploy` skill does this automatically — no extra steps needed after the first manual tag.

---

## 17. Skills Deep Dive

### Skill Anatomy — Exact Markup Format

Every skill is a `.md` file in `.claude/commands/`. The exact format:

```markdown
---
description: One-line summary shown in /help
allowed-tools: Bash, Read, Write, Grep
argument-hint: <placeholder shown in CLI>
---

You are a [role]. When invoked with $ARGUMENTS, you must:
1. [Explicit step with exact commands]
2. [Step two — reference exact file paths]

Always output:
## Result
[structured output]
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `description` | Shown in `/help` — keep it action-oriented |
| `allowed-tools` | Restricts which Claude tools can be used — security and predictability |
| `argument-hint` | Placeholder shown in CLI after the skill name |
| `$ARGUMENTS` | The text the user types after the skill name |

### All 8 Skills — Full Markup

The skills were created in Part 4 with full frontmatter and body. Here is a quick-reference table:

| Skill | File | Trigger | Side Effect |
|-------|------|---------|------------|
| `/scaffold-server` | `.claude/commands/scaffold-server.md` | `/scaffold-server` | Creates entire server/ tree |
| `/scaffold-client` | `.claude/commands/scaffold-client.md` | `/scaffold-client` | Creates entire client/ tree |
| `/create-user-stories` | `.claude/commands/create-user-stories.md` | `/create-user-stories "feature"` | Creates Trello cards |
| `/run-tests` | `.claude/commands/run-tests.md` | `/run-tests` | None |
| `/unit-test-on-deploy` | `.claude/commands/unit-test-on-deploy.md` | `/unit-test-on-deploy` | Blocks if fail |
| `/check-coverage` | `.claude/commands/check-coverage.md` | `/check-coverage` | None |
| `/create-release-notes` | `.claude/commands/create-release-notes.md` | `/create-release-notes v1.0.0` | GitHub Release |
| `/deploy` | `.claude/commands/deploy.md` | `/deploy` | Deploys + release |

### Skill Storage Locations

- `.claude/commands/` — project-scoped (this repo only)
- `~/.claude/commands/` — global (available in all projects)
- Share via `CLAUDE.md` import: `@.claude/commands/run-tests.md`

---

## 18. Agents Deep Dive

### What Agents Are

Agents are subprocess Claude instances launched by the main Claude Code session. Each agent:
- Has its own isolated context window
- Can only access the tools you specify in its frontmatter
- Returns a single structured result to the parent
- Can run in parallel with other agents

### Skills vs Agents

| | Skills | Agents |
|--|--------|--------|
| Duration | < 1 minute, single shot | Multi-step, can take minutes |
| Context | Shares parent context | Isolated context window |
| Use case | Deterministic, repetitive tasks | Research, analysis, parallel work |
| Invocation | User types `/skill-name` | Claude Code spawns automatically |

### Agent 1 — `test-reporter`

File: `.claude/agents/test-reporter.md`

```markdown
---
name: test-reporter
description: Runs all tests and returns a structured pass/fail report with failure details
tools: Bash, Read, Grep
---

1. cd server && npm test -- --reporter=json > /tmp/server-results.json
2. cd client && npm test -- --run --reporter=json > /tmp/client-results.json
3. npx playwright test --reporter=json > /tmp/e2e-results.json

Parse all three JSON outputs and return:

## Test Report — [timestamp]

| Suite         | Passed | Failed | Duration |
|---------------|--------|--------|----------|
| Unit (server) | X      | X      | Xs       |
| Unit (client) | X      | X      | Xs       |
| Integration   | X      | X      | Xs       |
| E2E           | X      | X      | Xs       |

### Failures
- Test: [name] | File: [path:line] | Error: [message]

Final status: PASS or FAIL
```

### Agent 2 — `pr-reviewer`

File: `.claude/agents/pr-reviewer.md`

```markdown
---
name: pr-reviewer
description: Reviews a PR diff for code quality, test coverage, and security issues
tools: Bash, Read, Grep
---

Given branch name $ARGUMENTS:

1. git diff main..$ARGUMENTS -- server/ client/
2. Check each changed file for:
   - Missing unit tests for new functions
   - Hardcoded secrets or API keys
   - Unprotected routes (missing authMiddleware)
   - Unguarded agent-only endpoints (missing requireRole)
   - Console.log statements left in production code
3. Check DocumentChunk model is not modified without updating ingestDocs.js

Output:
## PR Review: $ARGUMENTS

### Summary
[2-3 sentences]

### Issues Found
- [CRITICAL/WARNING/INFO] [file:line] — [description]

### RAG Integrity
[confirm DocumentChunk schema and ingestDocs.js are in sync]

### Recommendation: APPROVE / REQUEST_CHANGES
```

### Agent 3 — `story-creator`

File: `.claude/agents/story-creator.md`

```markdown
---
name: story-creator
description: Creates Trello user story cards via MCP for a given feature
tools: Bash
---

Given feature description $ARGUMENTS:

1. Generate 3-5 user stories: "As a [role], I want [action], so that [benefit]"
   Roles available: buyer, agent, seller, admin
2. Write Given/When/Then criteria for each
3. Create one Trello card per story in Backlog list with label "Story"

Output:
## Stories Created for: $ARGUMENTS

| Story | Card URL |
|-------|---------|
| As a buyer... | https://trello.com/c/... |
```

### Agent 4 — `doc-ingester`

File: `.claude/agents/doc-ingester.md`

```markdown
---
name: doc-ingester
description: Reads all company-docs markdown files and seeds the DocumentChunk MongoDB collection
tools: Bash, Read
---

1. Read all .md files in server/src/data/company-docs/
2. Verify each file is non-empty and has at least one heading
3. Run: cd server && node src/scripts/ingestDocs.js
4. Confirm chunk counts match expected (buyer: 6, seller: 5, mortgage: 7, etc.)
5. Return a summary of chunks created per file

Output:
## RAG Ingestion Complete

| File | Chunks | Words (approx) | Status |
|------|--------|---------------|--------|
| buyer-guide.md | 6 | 2,800 | OK |
| ...            |   |       |    |

Total: X chunks. RAG store ready.
```

### Spawning Agents

```
Use the pr-reviewer agent to review the feature/rag-chatbot branch
```

```
Spawn the doc-ingester agent to reseed the RAG store after I updated seller-guide.md
```

Claude runs the agent in an isolated context and returns the structured result to your chat.

---

## 19. Hooks Deep Dive

### What Hooks Are

Hooks are shell commands that Claude Code executes **automatically** in response to its own tool usage. They require zero invocation from you — they just fire.

### Complete `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(npx *)",
      "Bash(vercel *)",
      "Bash(gh *)",
      "Bash(node scripts/*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git push*)",
        "hooks": [{
          "type": "command",
          "command": "cd \"$CLAUDE_PROJECT_DIR\" && npm run test:unit -- --run 2>&1; if [ $? -ne 0 ]; then echo 'BLOCKED: unit tests failed.' >&2; exit 2; fi"
        }]
      },
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "echo \"[$(date '+%Y-%m-%d %H:%M:%S')] WRITE: $CLAUDE_TOOL_INPUT_FILE_PATH\" >> \"$CLAUDE_PROJECT_DIR/.claude/activity.log\""
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash(vercel --prod*)",
        "hooks": [{
          "type": "command",
          "command": "cd \"$CLAUDE_PROJECT_DIR\" && TAG=$(git tag --sort=-version:refname | head -1) && PREV=$(git tag --sort=-version:refname | sed -n '2p') && echo \"## Release $TAG\" > /tmp/rn.md && git log $PREV..$TAG --oneline --no-merges >> /tmp/rn.md && gh release create $TAG --notes-file /tmp/rn.md --title \"Release $TAG\""
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "printf '\\a' && echo '[Claude Code] Task complete.'"
        }]
      }
    ]
  }
}
```

### Hook Event Types

| Type | When It Runs | Exit 2 Blocks? | Use Case |
|------|-------------|---------------|---------|
| `PreToolUse` | Before tool executes | Yes | Gate dangerous actions |
| `PostToolUse` | After tool succeeds | No | Side effects (release, notify) |
| `Notification` | Claude sends notification | No | Relay to Slack / desktop |
| `Stop` | Claude finishes a task turn | No | Terminal bell, log |
| `SubagentStop` | Spawned agent finishes | No | Aggregate parallel results |

### Matcher Syntax

| Pattern | Matches |
|---------|---------|
| `"Bash"` | ALL Bash calls |
| `"Bash(git push*)"` | Only `git push` commands (glob) |
| `"Bash(vercel --prod*)"` | Only production deploys |
| `"Bash(node scripts/*)"` | Only scripts/ runs |
| `"Write"` | All file writes |

### Exit Codes

| Code | Effect |
|------|--------|
| `exit 0` | Success — proceed normally |
| `exit 1` | Report error to Claude but proceed |
| `exit 2` | **BLOCK** — tool will not execute |

### Environment Variables in Hooks

| Variable | Description |
|----------|-------------|
| `$CLAUDE_PROJECT_DIR` | Root directory of current project |
| `$CLAUDE_TOOL_INPUT_FILE_PATH` | Target file path (Write/Edit hooks) |
| `$CLAUDE_TOOL_INPUT_COMMAND` | Full bash command being run |

### Four Hook Examples Walked Through

**Example 1 — Block git push if tests fail:**
`PreToolUse` fires before `git push`. Runs `npm run test:unit -- --run`.
If any test fails, exits 2 → push is blocked entirely.
Claude Code reports: *"Hook blocked the push — unit tests failed. Fix them first."*

**Example 2 — Auto release notes after deploy:**
`PostToolUse` fires after `vercel --prod` succeeds.
Reads the latest tag, collects git log, formats notes, calls `gh release create`.
GitHub Release is created automatically — no extra steps.

**Example 3 — Log every file write:**
Every `Write` call appends a timestamped line to `.claude/activity.log`.
Useful audit trail: `cat .claude/activity.log` shows every file Claude has touched.

**Example 4 — Terminal bell on task completion:**
`Stop` hook runs `printf '\a'` whenever Claude finishes.
Switch to another window during a long scaffold — the bell brings you back.

---

## 20. Appendices

### Appendix A — Final Folder Structure

```
Real-Estate-App/
  client/
    src/
      api/axios.js
      context/AuthContext.jsx
      components/
        Navbar.jsx
        PropertyCard.jsx
        PropertyFilters.jsx
        ImageGallery.jsx
        MortgageCalculator.jsx
        FavoriteButton.jsx
        InquiryForm.jsx
        ProtectedRoute.jsx
        AgentRoute.jsx
        RagChatbot.jsx          <- persistent floating widget
        AIDescriptionGenerator.jsx
      pages/
        Login.jsx  Register.jsx  Home.jsx
        PropertyDetail.jsx  CreateProperty.jsx  EditProperty.jsx
        SearchResults.jsx  SavedProperties.jsx
        AgentDashboard.jsx  MyInquiries.jsx
      hooks/useSSE.js
      App.jsx
    design-reference/           <- Pencil MCP PNG exports
    e2e/                        <- Playwright tests
    playwright.config.ts
    package.json
  server/
    src/
      config/db.js  cloudinary.js  anthropic.js
      controllers/
        authController.js  propertyController.js
        inquiryController.js  aiController.js
      middleware/
        authMiddleware.js  roleMiddleware.js  rateLimit.js
      models/
        User.js  Property.js  Inquiry.js  DocumentChunk.js
      routes/
        authRoutes.js  propertyRoutes.js
        inquiryRoutes.js  aiRoutes.js
      scripts/ingestDocs.js     <- run once to seed RAG store
      data/company-docs/        <- 7 mock .md files
      index.js
    tests/unit/  tests/integration/
    .env.example
    package.json
  .claude/
    commands/                   <- 8 skill .md files
    agents/                     <- 4 agent .md files
    settings.json               <- permissions + hooks
    activity.log                <- written by Write hook
  .github/workflows/ci.yml
  CLAUDE.md
  vercel.json
  .gitignore
```

---

### Appendix B — All Environment Variables

| Variable | Where | Notes |
|----------|-------|-------|
| `ANTHROPIC_API_KEY` | `server/.env` + Vercel only | Never in CI / GitHub Secrets |
| `MONGODB_URI` | `server/.env` + Vercel + GitHub Secrets | Used in CI for integration tests |
| `JWT_SECRET` | `server/.env` + Vercel + GitHub Secrets | 64-byte hex |
| `CLOUDINARY_CLOUD_NAME` | `server/.env` + Vercel + GitHub Secrets | |
| `CLOUDINARY_API_KEY` | `server/.env` + Vercel + GitHub Secrets | |
| `CLOUDINARY_API_SECRET` | `server/.env` + Vercel + GitHub Secrets | |
| `VITE_API_URL` | Vercel only | `https://your-project.vercel.app/api` |

---

### Appendix C — Mock Company Documents

The following 7 files live in `server/src/data/company-docs/`. They are ingested by `scripts/ingestDocs.js` into the `DocumentChunk` MongoDB collection and power the RAG chatbot in Feature 6.

---

#### `buyer-guide.md`

```markdown
# Meridian Realty Group — Complete Buyer's Guide

## Understanding the Buying Process

Purchasing a property is one of the most significant financial decisions you will make.
Meridian Realty Group is here to guide you through every step with transparency and expertise.

## Step 1 — Establish Your Budget

Before viewing any properties, get a Decision in Principle (DIP) from a mortgage lender.
This confirms how much you can borrow and makes you a credible buyer. Budget for:

- Deposit: typically 5–20% of purchase price
- Stamp Duty Land Tax (SDLT): 0% on first £250,000, 5% on portion from £250,001–£925,000
- Legal fees (conveyancing solicitor): £1,000–£2,500
- Survey costs: £400–£1,500 depending on survey type
- Mortgage arrangement fee: £0–£1,999 depending on product
- Removals: £500–£2,000

## Step 2 — Register with Meridian Realty

Create a buyer profile on the Meridian Property Portal. Set your search preferences
(area, bedrooms, price range, property type) to receive instant alerts when matching
properties are listed.

## Step 3 — Property Search and Viewings

Use our Natural Language Search to find properties with queries like "3-bed near top-rated
schools under £450,000 in Greenwich Park". Request viewings directly through the portal.
We typically confirm viewings within 2 business hours.

## Step 4 — Making an Offer

Once you find the right property, submit your offer through the portal or contact your
Meridian agent directly. Include your DIP and proof of deposit to strengthen your position.
We present all offers to the seller within 24 hours.

## Step 5 — Offer Accepted — Instruct Solicitors

Upon acceptance, both buyer and seller instruct solicitors. Your solicitor will:
- Conduct local authority searches (2–6 weeks)
- Review the contract pack sent by seller's solicitor
- Raise enquiries on any title issues
- Confirm mortgage offer from your lender

## Step 6 — Survey

We recommend at minimum a HomeBuyer Report (Level 2 RICS survey). For older or unusual
properties, a Full Building Survey (Level 3) provides the most detail. Surveys typically
take 1–2 weeks to complete after instruction.

Survey types:
- Mortgage Valuation: lender's valuation only — does not protect you
- HomeBuyer Report (Level 2): visual inspection, flags defects, £400–£900
- Full Building Survey (Level 3): detailed structural assessment, £800–£1,500

## Step 7 — Exchange of Contracts

Once all searches are complete and both parties are ready, solicitors exchange contracts.
At this point you pay your deposit and the sale becomes legally binding. A completion date
is set — typically 2–4 weeks after exchange.

## Step 8 — Completion

On completion day, funds transfer from your lender to the seller's solicitor.
You collect keys from the agent. You are now a homeowner.
Meridian Realty's fee is charged to the seller — buyers pay nothing to us.

## Meridian Buyer Promise

- No buyer fees
- Viewings confirmed within 2 business hours
- Dedicated agent contact throughout
- Portal access to track your purchase progress
```

---

#### `seller-guide.md`

```markdown
# Meridian Realty Group — Seller's Guide

## Preparing to Sell

## Choosing the Right Time

Property markets have seasonal patterns. Spring (March–May) and autumn (September–November)
typically see the highest buyer activity. However, motivated buyers are active year-round,
and limited stock in winter can mean faster sales and stronger offers.

## Step 1 — Valuation

Request a free valuation from your Meridian agent. We compare:
- Recent sold prices on your street (Land Registry data)
- Current competing listings in your area
- Property condition and unique features

We provide an honest market appraisal, not an inflated valuation designed to win your business.

## Step 2 — Legal Requirements

Before listing, you will need:
- **Energy Performance Certificate (EPC)**: legally required, valid 10 years, costs £60–£120.
  Properties must have a valid EPC to be marketed.
- **Fixtures and Fittings Form (TA10)**: declares what is included in the sale.
- **Property Information Form (TA6)**: discloses known issues, disputes, planning permissions.

## Step 3 — Preparing Your Property

First impressions on the portal determine whether buyers request viewings:
- Professional photography is included in our Standard and Premium packages
- Declutter and depersonalise each room
- Fix obvious defects: leaking taps, cracked tiles, broken handles
- Fresh neutral paint adds value at low cost
- Ensure the garden is tidy for exterior shots

## Step 4 — Listing and Marketing

Your listing goes live on the Meridian Property Portal within 24 hours of instruction.
We also list on Rightmove and Zoopla as part of all packages. Your agent will:
- Write a compelling property description (AI-assisted via our portal)
- Arrange and conduct all viewings (you do not need to be present)
- Provide weekly feedback reports from viewings

## Step 5 — Receiving Offers

We present all offers to you in writing within 24 hours of receipt.
We verify buyers are proceedable (mortgage agreed in principle, or cash buyers with proof).
We advise on offer strength but the decision is always yours.

## Step 6 — Negotiation

We negotiate on your behalf with full transparency. Common scenarios:
- Multiple offers: we manage a best-and-final-offers process
- Below asking price: we counter with evidence to justify asking price
- Subject to survey: normal and expected; we help assess any renegotiation requests after survey

## Step 7 — Exchange and Completion

Once a price is agreed, both solicitors work towards exchange. Typical timescales:
- Leasehold properties: 10–16 weeks from acceptance to completion
- Freehold properties: 8–14 weeks from acceptance to completion

## Meridian Fees

| Package | Fee (inc VAT) | What's Included |
|---------|--------------|----------------|
| Essential | 1.2% | Portal listing, Rightmove, Zoopla, viewings |
| Standard | 1.5% | Everything above + professional photography |
| Premium | 1.8% | Everything above + floor plan, social media promotion, premium portal placement |

Fees are only payable on completion — you pay nothing if we do not sell your property.
```

---

#### `mortgage-guide.md`

```markdown
# Meridian Realty Group — Mortgage Guide

## Understanding Your Mortgage Options

A mortgage is a loan secured against your property. If you do not keep up repayments,
your home may be repossessed. This guide explains the main options.

## Types of Mortgage

### Fixed Rate
Your interest rate is locked for an initial period (2, 3, or 5 years are most common).
Your monthly payment stays the same regardless of Bank of England base rate changes.
Best for: buyers who want payment certainty and are risk-averse.

After the fixed period, you revert to the lender's Standard Variable Rate (SVR),
which is typically higher. Remortgage before this happens.

### Tracker Mortgage
Tracks the Bank of England base rate plus a set margin (e.g. Base Rate + 1.5%).
Payments rise and fall with base rate changes.
Best for: buyers who expect rates to fall, or who want flexibility without early repayment charges.

### Variable / SVR
The lender's standard rate, which they can change at will. Almost always the most expensive
option. Never let your fixed deal expire onto SVR without remortgaging.

### Offset Mortgage
Links your mortgage to a savings account. Savings offset against your mortgage balance,
reducing the interest charged. Best for: high earners with significant savings.

## Loan-to-Value (LTV) Ratios

LTV = (Loan Amount / Property Value) × 100

| LTV | Deposit | Typical Rate Range |
|-----|---------|-------------------|
| 60% | 40% | Best rates available |
| 75% | 25% | Good rates |
| 85% | 15% | Moderate rates |
| 90% | 10% | Higher rates |
| 95% | 5% | Highest rates; limited lenders |

The lower your LTV, the better the rate you will be offered.

## Affordability Calculation

Lenders typically lend 4–4.5× your gross annual income (salary before tax).
Some specialist lenders go to 5× or higher for professionals.

Example: Gross income £60,000 × 4.5 = maximum borrowing of £270,000.

Stress testing: lenders check you can afford repayments if rates rise by 3%.

Use the Meridian Mortgage Calculator on any property page to estimate your monthly payment:
Monthly Payment = [P × r(1+r)ⁿ] / [(1+r)ⁿ-1]
where P = principal, r = monthly rate, n = number of months.

## The Mortgage Application Process

1. **Decision in Principle (DIP)**: soft credit check, takes 10–15 minutes online.
   Valid for 60–90 days. Required before making an offer.
2. **Full Application**: after offer accepted. Documents required: 3 months payslips,
   3 months bank statements, 2 years P60, proof of identity and address.
3. **Valuation**: lender instructs their own valuation (not a survey). Takes 1–2 weeks.
4. **Mortgage Offer**: issued after valuation passes. Valid 3–6 months.
5. **Completion**: funds released to solicitor on completion day.

## Broker vs Direct

| | Mortgage Broker | Direct to Lender |
|--|----------------|-----------------|
| Access | Whole of market | Single lender's products |
| Cost | Free (paid by lender) or fee £300–£500 | Free |
| Time | 1 meeting → multiple quotes | Multiple applications needed |
| Advice | Full recommendation and protection | Execution only (most) |

Meridian Realty partners with independent brokers who offer whole-of-market advice.
Ask your agent for a free referral.

## Help to Buy and Government Schemes

- **Shared Ownership**: buy 25–75% of a property; pay rent on the remaining share.
- **First Homes Scheme**: 30–50% discount for first-time buyers on new builds.
- **Lifetime ISA (LISA)**: save up to £4,000/year; government adds 25% bonus (max £1,000/year).
  Use towards a first home purchase.
```

---

#### `area-guide-city-centre.md`

```markdown
# Meridian City Centre — Area Guide

## Overview

Meridian City Centre is the commercial and cultural heart of the region.
It offers a vibrant mix of converted warehouses, modern apartment buildings,
and Victorian terraces within walking distance of major employers, transport hubs,
and an acclaimed restaurant and arts scene.

## Transport

- **Rail**: Meridian Central Station — direct services to London Paddington (45 min),
  Birmingham New Street (30 min), Bristol Temple Meads (55 min). Trains every 15 minutes
  during peak hours.
- **Bus**: 12 routes serving the city centre. Night buses on Friday and Saturday.
- **Cycling**: 45km of segregated cycle lanes. Docking stations every 400m.
- **Parking**: limited and expensive (£3.50/hour in NCP). Most city centre residents
  live car-free.

## Schools

| School | Type | Ofsted | Distance from centre |
|--------|------|--------|---------------------|
| Meridian Academy | State Secondary | Outstanding | 0.8 miles |
| St. Catherine's Primary | State Primary | Good | 0.4 miles |
| Meridian Grammar | State Grammar | Outstanding | 1.2 miles |
| The International School | Independent | N/A (ISI) | 0.6 miles |

## Property Market

Average prices (Q1 2026):
- Studio flat: £185,000–£220,000
- 1-bedroom flat: £240,000–£310,000
- 2-bedroom flat: £320,000–£420,000
- 2-bedroom terraced house: £380,000–£480,000
- 3-bedroom house: £480,000–£650,000

Rental yields average 5.2–6.1% for flats, making this one of the strongest
buy-to-let markets in the region.

## Regeneration

The Western Wharf Development (2024–2028) will deliver 2,400 new homes,
a 3-acre public park, and 60,000 sq ft of retail. Properties within 0.5 miles
of the development boundary have seen 12% above-average capital growth since
planning approval.

## Amenities

- Meridian Market Hall: 40 independent food and drink stalls, open daily
- Everyman Cinema, independent gallery spaces, theatre district
- Meridian Leisure Centre (50m pool, gym, climbing wall)
- Waitrose, M&S Food, and Lidl all within 5-minute walk
- Green space: Central Park (8 acres), River Walk (2.5 miles)
```

---

#### `area-guide-greenwich-park.md`

```markdown
# Greenwich Park — Area Guide

## Overview

Greenwich Park is Meridian's most sought-after family suburb, offering large period
homes, outstanding state schools, and a community feel within 25 minutes of the city centre.
It consistently tops local "best places to live" surveys and has seen steady 6–8%
annual capital growth over the past decade.

## Transport

- **Rail**: Greenwich Park Station — direct to Meridian Central (22 min), hourly off-peak,
  every 15 minutes during rush hour.
- **Bus**: routes 14, 27, and 42 connect to city centre (35–40 min). Less frequent evenings.
- **Car**: A-road access to motorway junction in 8 minutes. Most households run 1–2 cars.
- **Cycling**: quieter roads suitable for families. 3km off-road cycle path to city centre.

## Schools

| School | Type | Ofsted | Catchment notes |
|--------|------|--------|----------------|
| Greenwich Park Primary | State | Outstanding | Tight catchment (~0.4 miles in 2025) |
| St. Mary's CE Primary | State | Good | Sibling priority applies |
| Meridian Academy (Greenwich Campus) | State Secondary | Outstanding | Selective entry exam |
| Greenwich Park Prep | Independent | ISI Excellent | Ages 3–11, £12,500/term |

> Note: Catchment areas change annually. Always verify with the local authority before purchasing
> if school access is a priority.

## Property Market

Average prices (Q1 2026):
- 2-bedroom semi-detached: £420,000–£520,000
- 3-bedroom semi-detached: £540,000–£680,000
- 3-bedroom detached: £640,000–£850,000
- 4-bedroom detached: £850,000–£1,200,000
- Period townhouse (4–5 bed): £1,100,000–£1,600,000

Properties within the Outstanding primary school catchment command a 15–20% premium
over equivalent homes just outside it.

## Community and Lifestyle

- Greenwich Park Farmers' Market: every Saturday, 8am–1pm
- Greenwich Park Country Club: tennis, squash, swimming (membership: £1,200/year)
- 340-acre Royal Park with children's playground, café, and boating lake
- Active residents' association and neighbourhood watch scheme
- Low crime rates: 40% below regional average

## Development Pipeline

No major new developments planned within the conservation area, which protects
architectural character and supports long-term property values. The only new supply
is limited infill development on garden plots (typically 2–3 homes per year).
```

---

#### `investment-guide.md`

```markdown
# Meridian Realty Group — Property Investment Guide

## Why Invest in Property?

Property investment offers three potential returns:
1. **Rental income**: monthly cash flow from tenants
2. **Capital growth**: increase in property value over time
3. **Leverage**: ability to control a large asset with a smaller deposit

Unlike equities, property is a tangible asset you can improve and add value to.

## Buy-to-Let Fundamentals

### Gross Rental Yield

Gross Yield = (Annual Rent / Property Value) × 100

Example: property worth £250,000 renting for £1,100/month:
Gross Yield = (£13,200 / £250,000) × 100 = 5.28%

### Net Rental Yield

Net Yield accounts for costs:
- Mortgage interest (if leveraged)
- Letting agent fee: 8–15% of monthly rent
- Maintenance: budget 1% of property value per year
- Buildings insurance: £200–£400/year
- Void periods: budget for 1–2 months empty per year

Meridian City Centre net yields: 4.0–5.2%
Greenwich Park net yields: 2.8–3.8% (lower yield, higher capital growth)

### Capital Growth

Historical average capital growth (Meridian region, 10-year average):
- City Centre: 5.1% per year
- Greenwich Park: 6.8% per year
- Wider region: 4.2% per year

Past performance does not guarantee future results.

## Tax Implications

### Stamp Duty Surcharge
A 3% SDLT surcharge applies to all investment property purchases (i.e. if you already own
a home). This is payable on top of the standard SDLT rates.

### Income Tax
Rental income is taxable. From April 2020, mortgage interest relief is restricted to
the basic rate (20%) for individual landlords. Consider whether a limited company
structure is more tax-efficient (consult a tax adviser).

### Capital Gains Tax (CGT)
On sale: gains above the annual exemption (£6,000 in 2025/26) are taxed at:
- 18% (basic rate taxpayer)
- 24% (higher rate taxpayer)

CGT is not payable on your primary residence (Principal Private Residence relief).

## Portfolio Strategy

### Single Asset
Start with one well-located flat. Simpler to manage; lower capital requirement.
Re-mortgage when equity builds to fund a second purchase.

### HMO (House in Multiple Occupation)
Rent individual rooms to sharers. Higher gross yield (7–10%) but:
- Requires HMO licence if 5+ unrelated occupants
- Higher management overhead
- Greater wear and tear

### Off-Plan Purchase
Buy before construction completes. Benefits: lower entry price, phased payment schedule.
Risks: construction delays, market change during build period.

## Meridian Realty Investment Service

We offer a dedicated investor service:
- Portfolio analysis and market comparison reports
- Off-market investment listings (register your criteria)
- Lettings management from 8% (+ VAT) of monthly rent
- Annual portfolio review meetings

Contact our investment team: investment@meridianrealty.co.uk
```

---

#### `faq.md`

```markdown
# Meridian Realty Group — Frequently Asked Questions

## Buying

**Q: How long does it take to buy a property?**
A: From offer accepted to completion, typically 10–16 weeks. Leasehold properties take
longer (10–16 weeks) than freehold (8–14 weeks). Delays are most commonly caused by
slow solicitors, mortgage valuations, or complex chains.

**Q: Do I need a solicitor to buy a property?**
A: Yes. A conveyancing solicitor (or licensed conveyancer) is legally required to transfer
ownership. We recommend instructing one as soon as your offer is accepted. Budget £1,000–£2,500.

**Q: What is a property chain?**
A: A chain occurs when multiple transactions are linked — your purchase depends on your
seller's purchase, which depends on their seller's, and so on. Longer chains carry more risk
of collapse. Chain-free properties (vacant possession or new builds) complete faster.

**Q: Can I make an offer below asking price?**
A: Yes. How much below asking price is reasonable depends on market conditions, how long the
property has been listed, and the seller's situation. Your Meridian agent will advise based
on comparable recent sales.

**Q: What happens if my survey reveals problems?**
A: You can: accept and proceed; renegotiate the price to reflect repair costs;
ask the seller to carry out repairs before exchange; or withdraw (before exchange, this
costs you only the survey and solicitor fees so far).

**Q: Do I pay Meridian Realty as a buyer?**
A: No. Our fee is charged to the seller. Buyers pay zero agency fees.

## Selling

**Q: How is my property valued?**
A: We use three data sources: Land Registry sold prices for comparable properties within
0.5 miles (last 12 months), current active listing prices, and our agents' knowledge of
local demand. We provide an honest market appraisal — not an inflated figure to win your instruction.

**Q: How long will it take to sell?**
A: Average time to an accepted offer in Meridian City Centre: 24 days.
Greenwich Park: 19 days. Regional average: 31 days. These vary significantly
with price, condition, and season.

**Q: Do I need to be present for viewings?**
A: No. Meridian agents conduct all viewings. Many sellers prefer not to be present
as buyers feel more comfortable exploring freely.

**Q: What if I want to cancel my listing?**
A: You can withdraw at any time before exchange at no charge. Our agency agreement
has a 14-day notice period, after which you are free to list elsewhere.

**Q: When do I pay the estate agent fee?**
A: Only on completion of the sale. If we do not sell your property, you owe us nothing.

## Mortgages and Finance

**Q: What is a Decision in Principle?**
A: A DIP (also called Agreement in Principle) is a conditional commitment from a lender
to lend you a certain amount, based on a soft credit check. It shows sellers you are a
serious buyer. It takes 10–15 minutes online and is valid for 60–90 days.

**Q: How much deposit do I need?**
A: Minimum 5% (95% LTV mortgage). Better rates start at 10% (90% LTV). The more deposit
you have, the lower your interest rate and monthly payments.

**Q: Can I get a mortgage if I am self-employed?**
A: Yes, but lenders require 2–3 years of self-assessment tax returns (SA302 forms) and
corresponding tax year overviews. Some lenders average your last 2 years' profit;
others use the lower figure. Specialist brokers access lenders tailored to self-employed applicants.

**Q: What is remortgaging?**
A: Switching your mortgage to a new deal — either with your current lender (product transfer)
or a different lender. Most people remortgage every 2–5 years when their fixed deal expires
to avoid the higher Standard Variable Rate.

## Renting vs Buying

**Q: Is it better to rent or buy?**
A: This depends on your personal circumstances, how long you plan to stay, local price-to-rent
ratios, and mortgage rates. As a rough guide: if you plan to stay 5+ years and can afford a
deposit, buying typically builds more wealth than renting the equivalent property.
Our agents can run a rent-vs-buy comparison for any property you are considering.

**Q: What costs do renters avoid that buyers face?**
A: Stamp Duty, survey costs, legal fees, maintenance costs, mortgage arrangement fees.
Renters also retain capital flexibility. However renters face rent increases and
insecurity of tenure.

## The Meridian Property Portal

**Q: How do I set up property alerts?**
A: Create a free account, set your search criteria (area, bedrooms, price, type),
and toggle "Instant Alerts". You will receive an email within minutes of a matching
property being listed.

**Q: Can I use the chatbot for specific legal advice?**
A: The Meridian Assistant answers questions based on our general guides and FAQs.
It does not provide legal, financial, or tax advice. For specific advice, always
consult a qualified solicitor, IFA, or tax adviser.

**Q: How do I contact my assigned agent?**
A: Once you have viewed a property or submitted an inquiry through the portal, you are
assigned a dedicated agent. Their direct email and phone number appear in your dashboard.
```

---

### Appendix D — RAG Architecture Diagram

```
User types question in RagChatbot.jsx
            │
            ▼
  POST /api/ai/rag-chat
  { question, history[] }
            │
            ▼
  ┌─────────────────────────┐
  │  Claude Call #1 (haiku) │  ← JSON mode, ~100ms
  │  Extract keywords from  │
  │  the user's question    │
  └────────────┬────────────┘
               │ { keywords: ["buying","process","stamp duty"] }
               ▼
  ┌─────────────────────────┐
  │  MongoDB $text search   │  ← DocumentChunk collection
  │  on content + section   │
  │  .limit(5)              │
  └────────────┬────────────┘
               │ top 5 DocumentChunk documents
               ▼
  ┌─────────────────────────┐
  │  Build context string   │
  │  ---                    │
  │  SOURCE: buyer-guide.md │
  │  SECTION: Step 3        │
  │  [chunk content]        │
  │  ---  × 5 chunks        │
  └────────────┬────────────┘
               │
               ▼
  ┌─────────────────────────────────────────┐
  │  Claude Call #2 (sonnet, streaming)     │
  │  System: Answer ONLY from documents.   │
  │          Cite your sources.            │
  │  User:   <context>...</context>        │
  │          Question: {question}          │
  └────────────────┬────────────────────────┘
                   │  SSE stream: data: {chunk}
                   │  ...
                   │  data: {type:"[DONE]", sources:["buyer-guide.md"]}
                   ▼
  RagChatbot.jsx appends chunks to AI bubble
  Source citation pills rendered from sources[]
```

No external vector database. No embeddings API. Just MongoDB `$text` search + two Claude calls.

---

### Appendix E — MongoDB Schemas

```javascript
// User.js
{
  name:             String (required),
  email:            String (required, unique),
  password:         String (required, hashed),
  role:             String (enum: ['buyer','seller','agent'], default: 'buyer'),
  savedProperties:  [ObjectId ref Property],
  createdAt, updatedAt
}

// Property.js
{
  title:        String (required),
  description:  String,
  price:        Number (required),
  bedrooms:     Number (required),
  bathrooms:    Number,
  propertyType: String (enum: ['house','flat','studio','commercial']),
  location: {
    address:  String,
    city:     String (required),
    postcode: String,
    lat:      Number,
    lng:      Number
  },
  images: [{
    url:      String,
    caption:  String,     // AI-generated
    roomType: String      // AI-generated (e.g. 'Kitchen')
  }],
  agent:        ObjectId ref User (required),
  status:       String (enum: ['active','archived','sold'], default: 'active'),
  aiDescription: String,  // generated by Feature 1
  aiValuation:  {         // cached by Feature 2
    pricePerSqft:    Number,
    marketComment:   String,
    investmentScore: Number,
    comparableRange: { min: Number, max: Number },
    verdict:         String
  },
  $text index:  title + description + location.city
}

// Inquiry.js
{
  property:   ObjectId ref Property (required),
  buyer:      ObjectId ref User (required),
  message:    String (required),
  agentReply: String,
  status:     String (enum: ['new','replied','closed'], default: 'new'),
  createdAt
}

// DocumentChunk.js
{
  source:     String (required),  // e.g. 'buyer-guide.md'
  section:    String,             // heading the chunk falls under
  chunkIndex: Number (required),  // position within source file
  content:    String (required),  // ~500 words of text
  wordCount:  Number,
  createdAt
  // $text index on content + section
}
```
