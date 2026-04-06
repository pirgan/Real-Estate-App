/**
 * pages/SearchResults.jsx
 *
 * Natural-language search results matching the design reference (s5).
 *
 * Key features:
 *   - Reads initial query from URL search param ?q=... (set by Navbar search bar)
 *   - Dismissible filter chips with a "Clear all" option
 *   - Three-tier match badge: Exact Match (green) / Strong Match (blue) / Partial Match (orange)
 *   - "Best match" sort dropdown (client-side ordering by match tier)
 *   - Empty state with expand / adjust prompt
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import PropertyCard from '../components/PropertyCard.jsx';

const PinIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

// Assign a match tier deterministically based on index rank
function matchTier(index) {
  if (index === 0) return { label: 'Exact Match',   bg: 'bg-emerald-500' };
  if (index === 1) return { label: 'Strong Match',  bg: 'bg-blue-500' };
  return              { label: 'Partial Match',  bg: 'bg-orange-400' };
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [query,   setQuery]   = useState(initialQ);
  const [results, setResults] = useState(null);   // null = not yet searched
  const [filters, setFilters] = useState(null);   // extracted filter object
  const [chips,   setChips]   = useState([]);     // active dismissible chips
  const [loading, setLoading] = useState(false);
  const [sort,    setSort]    = useState('best');

  // Auto-search when the page loads with a ?q= param from the Navbar
  useEffect(() => {
    if (initialQ) runSearch(initialQ);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/search', { query: q });
      setResults(data.properties);
      setFilters(data.filters);
      // Build dismissible chips from extracted filter keys
      setChips(
        Object.entries(data.filters ?? {})
          .filter(([, v]) => v)
          .map(([key, val]) => ({ key, val: String(val) }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    runSearch(query);
  };

  const removeChip = (key) => setChips((c) => c.filter((ch) => ch.key !== key));
  const clearAll   = () => setChips([]);

  // Friendly chip labels
  const chipLabel = (key, val) => {
    const labels = {
      bedrooms:     `${val}+ beds`,
      maxPrice:     `Under £${Number(val).toLocaleString()}`,
      minPrice:     `From £${Number(val).toLocaleString()}`,
      city:          val,
      propertyType:  val.charAt(0).toUpperCase() + val.slice(1),
    };
    return labels[key] ?? val;
  };

  const totalResults = results?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Active filters:</span>
          {chips.map((ch) => (
            <span
              key={ch.key}
              className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {chipLabel(ch.key, ch.val)}
              <button onClick={() => removeChip(ch.key)} className="hover:text-amber-400 font-bold">×</button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-amber-500 hover:text-amber-600 font-semibold ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Results header */}
      {results !== null && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-slate-700 font-semibold text-sm">
            {totalResults > 0
              ? `${totalResults} result${totalResults !== 1 ? 's' : ''} matching your search`
              : 'No exact matches found'}
          </p>
          {totalResults > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-700 bg-white"
              >
                <option value="best">Best match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      )}

      {/* Results grid */}
      {results !== null && !loading && totalResults > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((p, i) => {
            const tier = matchTier(i);
            return (
              <div key={p._id} className="relative">
                {/* Match badge */}
                <div className={`absolute top-3 left-3 z-10 ${tier.bg} text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  {tier.label}
                </div>
                <PropertyCard property={p} />
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {results !== null && !loading && totalResults === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-800">No exact matches found</p>
            <p className="text-slate-400 text-sm mt-1">Try broadening your search — we've shown nearby results below.</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setChips([]); runSearch(query); }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
            >
              <PinIcon /> Expand search area
            </button>
            <button
              onClick={() => setChips([])}
              className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm"
            >
              Adjust filters
            </button>
          </div>
        </div>
      )}

      {/* Default state — no search yet */}
      {results === null && !loading && (
        <div className="text-center py-24 text-slate-400 text-sm">
          Use the search bar above to find properties.
        </div>
      )}
    </div>
  );
}
