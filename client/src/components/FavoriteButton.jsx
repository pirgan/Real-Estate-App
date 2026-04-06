/**
 * components/FavoriteButton.jsx
 *
 * Heart-shaped toggle button that saves or unsaves a property for the
 * authenticated buyer.  Rendered inside PropertyCard (top-right corner).
 *
 * Behaviour:
 *   - Hidden entirely when no user is logged in.
 *   - Calls PATCH /api/properties/:id/save on toggle; the server handles
 *     adding/removing the ID from the user's savedProperties array.
 *   - Optimistically flips the heart icon before the response arrives;
 *     errors are silently swallowed (a toast can be added if needed).
 *
 * Props:
 *   propertyId   — MongoDB _id of the property
 *   initialSaved — whether the property is already saved (default false)
 */
import { useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FavoriteButton({ propertyId, initialSaved = false }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await api.patch(`/properties/${propertyId}/save`);
      setSaved((s) => !s);
    } catch {
      // silently fail — toast can be added here
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={saved ? 'Remove from saved' : 'Save property'}
      className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition-colors ${
        saved ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-400 hover:text-rose-500'
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
