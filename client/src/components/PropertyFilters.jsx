/**
 * components/PropertyFilters.jsx
 *
 * Sidebar filter panel matching the design reference (s2-home-property-grid.png).
 *
 * Controls:
 *   - Price Range  — dual-handle range slider (min / max) with formatted labels
 *   - Bedrooms     — − / n / + stepper
 *   - Property Type — checkboxes (Detached House, Apartment/Flat, Terraced, New Build)
 *   - City         — dropdown (London, Manchester, Birmingham, …)
 *   - Apply Filters / Reset all
 *
 * State is kept locally until the user clicks "Apply Filters", preventing a
 * re-fetch on every keystroke / slider drag.
 */
import { useState } from 'react';

const MAX_PRICE = 2_000_000;
const STEP = 10_000;

const PROPERTY_TYPES = [
  { value: 'house', label: 'Detached House' },
  { value: 'flat', label: 'Apartment / Flat' },
  { value: 'studio', label: 'Terraced House' },
  { value: 'commercial', label: 'New Build' },
];

const CITIES = ['', 'London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh'];

const fmt = (n) => `£${(n / 1000).toFixed(0)}k`;

export default function PropertyFilters({ filters, onChange }) {
  const [minPrice, setMinPrice] = useState(filters?.minPrice ?? 150_000);
  const [maxPrice, setMaxPrice] = useState(filters?.maxPrice ?? 800_000);
  const [bedrooms, setBedrooms] = useState(filters?.bedrooms ?? 1);
  const [types, setTypes] = useState(
    filters?.propertyType ? [filters.propertyType] : []
  );
  const [city, setCity] = useState(filters?.city ?? '');

  // Toggle a property type checkbox
  const toggleType = (val) =>
    setTypes((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    );

  const apply = (e) => {
    e.preventDefault();
    onChange({
      minPrice,
      maxPrice,
      bedrooms: bedrooms || undefined,
      propertyType: types[0] || undefined, // API accepts single type
      city: city || undefined,
    });
  };

  const reset = () => {
    setMinPrice(0);
    setMaxPrice(MAX_PRICE);
    setBedrooms(1);
    setTypes([]);
    setCity('');
    onChange({});
  };

  return (
    <form onSubmit={apply} className="bg-white rounded-2xl shadow p-5 space-y-6 text-sm">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Filters</h2>
        <button type="button" onClick={reset} className="text-amber-500 hover:text-amber-600 text-xs font-semibold">
          Reset all
        </button>
      </div>

      {/* ── Price Range ── */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range</p>
        {/* Track */}
        <div className="relative h-5 flex items-center">
          {/* Background track */}
          <div className="absolute w-full h-1 bg-slate-200 rounded-full" />
          {/* Active track */}
          <div
            className="absolute h-1 bg-slate-800 rounded-full"
            style={{
              left: `${(minPrice / MAX_PRICE) * 100}%`,
              right: `${100 - (maxPrice / MAX_PRICE) * 100}%`,
            }}
          />
          {/* Min thumb */}
          <input
            type="range" min={0} max={MAX_PRICE} step={STEP}
            value={minPrice}
            onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - STEP))}
            className="absolute w-full"
          />
          {/* Max thumb */}
          <input
            type="range" min={0} max={MAX_PRICE} step={STEP}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + STEP))}
            className="absolute w-full"
          />
        </div>
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>{fmt(minPrice)}</span>
          <span>{fmt(maxPrice)}</span>
        </div>
      </div>

      {/* ── Bedrooms stepper ── */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bedrooms</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setBedrooms((b) => Math.max(1, b - 1))}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors font-bold"
          >
            −
          </button>
          <span className="font-bold text-slate-900 text-lg w-6 text-center">{bedrooms}</span>
          <button
            type="button"
            onClick={() => setBedrooms((b) => b + 1)}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors font-bold"
          >
            +
          </button>
          <span className="text-slate-400 text-xs">or more</span>
        </div>
      </div>

      {/* ── Property Type checkboxes ── */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Type</p>
        <div className="space-y-2">
          {PROPERTY_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group">
              <span
                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                  types.includes(value)
                    ? 'bg-slate-900 border-slate-900'
                    : 'border-slate-300 group-hover:border-slate-500'
                }`}
              >
                {types.includes(value) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={types.includes(value)}
                onChange={() => toggleType(value)}
              />
              <span className="text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── City dropdown ── */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</p>
        <div className="relative">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-slate-700"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c || 'All cities'}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </span>
        </div>
      </div>

      {/* Apply button */}
      <button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm"
      >
        Apply Filters
      </button>
    </form>
  );
}
