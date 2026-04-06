/**
 * components/PropertyCard.jsx
 *
 * Property card matching the design reference (s2-home-property-grid.png).
 *
 * Visual elements:
 *   - Full-bleed photo with dark navy price badge (top-left)
 *   - Heart/favourite button (top-right, white circle)
 *   - Title, location row with pin icon
 *   - Spec row: bed icon + count, bath icon + count, sqft icon + sqft (if present)
 *   - Entire card is clickable (Link wraps the card)
 */
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton.jsx';

// ── Inline spec icons ──────────────────────────────────────────────────────────
const BedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 12V7a1 1 0 011-1h16a1 1 0 011 1v5M3 12h18M3 12v5m18-5v5M3 17h18"/>
  </svg>
);

const BathIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M4 12h16M4 12V6a2 2 0 012-2h3m0 0V2m0 2h6M9 4h6m0 0V2m0 2a2 2 0 012 2v6M4 12v4a2 2 0 002 2h12a2 2 0 002-2v-4"/>
  </svg>
);

const SqftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"/>
  </svg>
);

const PinIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

export default function PropertyCard({ property }) {
  const { _id, title, price, bedrooms, bathrooms, sqft, location, images, status } = property;
  const thumb = images?.[0]?.url;

  return (
    <Link
      to={`/properties/${_id}`}
      className="group bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* ── Photo ── */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </div>
        )}

        {/* Price badge — dark navy */}
        <div className="absolute top-3 left-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
          £{price?.toLocaleString()}
        </div>

        {/* Favourite */}
        <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
          <FavoriteButton propertyId={_id} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <PinIcon />
          <span className="truncate">
            {location?.address}, {location?.city}
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-slate-600 text-xs mt-auto pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <BedIcon /> {bedrooms} {bedrooms === 1 ? 'bed' : 'beds'}
          </span>
          <span className="flex items-center gap-1">
            <BathIcon /> {bathrooms} {bathrooms === 1 ? 'bath' : 'baths'}
          </span>
          {sqft && (
            <span className="flex items-center gap-1 ml-auto">
              <SqftIcon /> {sqft.toLocaleString()} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
