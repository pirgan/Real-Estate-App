/**
 * components/Navbar.jsx
 *
 * Persistent top navigation bar matching the design reference (s2).
 *
 * Three zones:
 *   Left   — MERIDIAN brand logo (amber square + text)
 *   Centre — global property search bar; submits to /search?q=...
 *   Right  — Saved heart icon with count + user avatar circle (logged in)
 *            OR Login / Register links (logged out)
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // Submit the centre search bar → navigate to /search with query param
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Derive user initials for the avatar circle
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex items-center gap-4 sticky top-0 z-40 shadow-lg">

      {/* ── Brand ── */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-black text-sm leading-none">M</span>
        </div>
        <span className="text-white font-black tracking-[0.18em] uppercase text-sm hidden sm:block">
          Meridian
        </span>
      </Link>

      {/* ── Centre search bar ── */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z"/>
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city, postcode or property type…"
            className="w-full bg-slate-800 text-white placeholder:text-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </form>

      {/* ── Right side ── */}
      {user ? (
        <div className="flex items-center gap-4 shrink-0">
          {/* Saved icon */}
          <Link to="/saved" className="flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition-colors text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span className="hidden sm:block">Saved</span>
          </Link>

          {/* Avatar dropdown */}
          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-xs">
              {initials}
            </button>
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 hidden group-hover:block z-50 text-sm text-slate-700">
              {user.role === 'agent' && (
                <Link to="/dashboard" className="block px-4 py-2 hover:bg-slate-50">Dashboard</Link>
              )}
              <Link to="/my-inquiries" className="block px-4 py-2 hover:bg-slate-50">My Inquiries</Link>
              <Link to="/saved" className="block px-4 py-2 hover:bg-slate-50">Saved Properties</Link>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full text-left px-4 py-2 text-rose-500 hover:bg-slate-50"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0 text-sm font-medium">
          <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Login</Link>
          <Link
            to="/register"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>
      )}
    </nav>
  );
}
