/**
 * pages/Home.jsx
 *
 * Main property browsing page — the default landing page of the app.
 *
 * Layout:
 *   Left sidebar  — PropertyFilters panel (hidden on small screens)
 *   Right content — paginated 3-column property card grid
 *
 * Data fetching:
 *   Calls GET /api/properties with optional filter params and a page number.
 *   Re-fetches whenever filters or the current page changes.
 *   Skeleton loading placeholders are shown while the request is in-flight.
 *
 * State:
 *   properties — current page of results
 *   total      — total matching count (shown in the hero subtitle)
 *   page       — current pagination page (1-based)
 *   pages      — total number of pages
 *   filters    — active filter object passed to PropertyFilters
 *   loading    — drives the skeleton grid
 *
 * Pagination:
 *   Rendered as numbered buttons; clicking resets scroll and triggers a refetch.
 *   Applying new filters resets page to 1.
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios.js';
import PropertyCard from '../components/PropertyCard.jsx';
import PropertyFilters from '../components/PropertyFilters.jsx';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchProperties = useCallback(async (activeFilters, activePage) => {
    setLoading(true);
    try {
      const params = { page: activePage, limit: 12, ...activeFilters };
      // Remove empty values
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get('/properties', { params });
      setProperties(data.properties);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      // fail silently — toast can be added
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(filters, page);
  }, [filters, page, fetchProperties]);

  const handleFiltersChange = (newFilters) => {
    setPage(1);
    setFilters(newFilters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Find Your <span className="text-amber-500">Perfect Home</span>
        </h1>
        <p className="text-slate-500 mt-2">
          {total.toLocaleString()} active listings across the UK
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <PropertyFilters filters={filters} onChange={handleFiltersChange} />
        </aside>

        {/* Property grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-100 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <p className="text-center text-slate-400 py-20">No properties match your filters.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {properties.map((p) => (
                  <PropertyCard key={p._id} property={p} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                        p === page
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
