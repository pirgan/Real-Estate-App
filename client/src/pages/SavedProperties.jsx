/**
 * pages/SavedProperties.jsx
 *
 * Buyer's favourites grid — shows all properties the authenticated user has
 * saved via the FavoriteButton heart toggle.
 *
 * Data fetching:
 *   GET /api/auth/me/saved — returns the array of populated saved properties
 *   for the current user.  Errors are swallowed and treated as an empty list.
 *
 * Layout:
 *   - Skeleton placeholders while loading.
 *   - Empty state with a heart icon and prompt when no saves exist.
 *   - Responsive 3-column grid of PropertyCard components.
 *
 * This page is wrapped in <ProtectedRoute> in App.jsx; unauthenticated users
 * are redirected to /login before this component renders.
 */
import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import PropertyCard from '../components/PropertyCard.jsx';

export default function SavedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me/saved')
      .then(({ data }) => setProperties(data))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Saved Properties</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-slate-400 space-y-2">
          <p className="text-4xl">♡</p>
          <p>You haven't saved any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
