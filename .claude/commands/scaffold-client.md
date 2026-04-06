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