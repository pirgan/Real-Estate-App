/**
 * App.jsx
 *
 * Root component — sets up providers, routing, and global UI elements.
 *
 * Layout rules:
 *   - Navbar is hidden on /dashboard (the agent dashboard has its own
 *     full-page sidebar layout) and on /login and /register (the auth
 *     page is a standalone centred card with no navigation).
 *   - RagChatbot floating widget is hidden on the auth and dashboard pages.
 *   - /register redirects to /login (both routes render the combined
 *     Login page with a tab toggle).
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import RagChatbot from './components/RagChatbot.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AgentRoute from './components/AgentRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import PropertyDetail from './pages/PropertyDetail.jsx';
import CreateProperty from './pages/CreateProperty.jsx';
import EditProperty from './pages/EditProperty.jsx';
import SearchResults from './pages/SearchResults.jsx';
import SavedProperties from './pages/SavedProperties.jsx';
import AgentDashboard from './pages/AgentDashboard.jsx';
import MyInquiries from './pages/MyInquiries.jsx';

// Pages that manage their own layout (no global Navbar / chatbot)
const STANDALONE_ROUTES = ['/login', '/register', '/dashboard', '/create-property'];

function Layout() {
  const { pathname } = useLocation();
  const isStandalone = STANDALONE_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <>
      {!isStandalone && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Login />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/search"         element={<SearchResults />} />

        {/* Authenticated */}
        <Route path="/saved"          element={<ProtectedRoute><SavedProperties /></ProtectedRoute>} />
        <Route path="/my-inquiries"   element={<ProtectedRoute><MyInquiries /></ProtectedRoute>} />
        <Route path="/edit-property/:id" element={<ProtectedRoute><EditProperty /></ProtectedRoute>} />

        {/* Create property — has its own top bar, no global Navbar */}
        <Route path="/create-property" element={<ProtectedRoute><CreateProperty /></ProtectedRoute>} />

        {/* Agent only — full-page sidebar layout */}
        <Route path="/dashboard"      element={<AgentRoute><AgentDashboard /></AgentRoute>} />
      </Routes>

      {/* Floating RAG chatbot — hidden on auth and full-page layout routes */}
      {!isStandalone && <RagChatbot />}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
