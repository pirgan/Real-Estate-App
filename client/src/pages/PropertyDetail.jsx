/**
 * pages/PropertyDetail.jsx
 *
 * Full property detail page matching the design reference (s3-property-detail.png).
 *
 * Layout:
 *   - Breadcrumb: Properties → {city} → {title}
 *   - Full-width ImageGallery (hero + vertical thumbnail strip)
 *   - Two-column below:
 *       Left  — title + "For Sale" badge, price, location, icon spec row,
 *               description, always-visible AI Insights panel
 *       Right — "Book a Viewing" card (agent avatar, name, role, inquiry form,
 *               Generate AI Description button), Mortgage Calculator
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios.js';
import ImageGallery from '../components/ImageGallery.jsx';
import MortgageCalculator from '../components/MortgageCalculator.jsx';
import InquiryForm from '../components/InquiryForm.jsx';
import AIDescriptionGenerator from '../components/AIDescriptionGenerator.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// ── Spec icons ────────────────────────────────────────────────────────────────
const BedIcon   = () => <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12V7a1 1 0 011-1h16a1 1 0 011 1v5M3 12h18M3 12v5m18-5v5M3 17h18"/></svg>;
const BathIcon  = () => <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16M4 12V6a2 2 0 012-2h3m0 0V2m0 2h6M9 4h6m0 0V2m0 2a2 2 0 012 2v6M4 12v4a2 2 0 002 2h12a2 2 0 002-2v-4"/></svg>;
const SqftIcon  = () => <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"/></svg>;
const TypeIcon  = () => <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>;
const PinIcon   = () => <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;

// Verdict colour mapping for the AI Insights panel
const VERDICT_STYLES = {
  'Fairly Priced': 'text-emerald-600 bg-emerald-50',
  'Overpriced':    'text-rose-600 bg-rose-50',
  'Great Deal':    'text-blue-600 bg-blue-50',
};

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [valuation, setValuation]         = useState(null);
  const [loadingVal, setLoadingVal]       = useState(false);
  const [valuationExpanded, setValuationExpanded] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchValuation = async () => {
    if (valuation) { setValuationExpanded((e) => !e); return; }
    setLoadingVal(true);
    try {
      const { data } = await api.post(`/ai/properties/${id}/valuation`);
      setValuation(data);
      setValuationExpanded(true);
    } finally {
      setLoadingVal(false);
    }
  };

  if (loading)  return <div className="flex justify-center py-32 text-slate-400">Loading…</div>;
  if (!property) return <div className="text-center py-32 text-slate-400">Property not found.</div>;

  const isOwner = user &&
    (user.role === 'agent' || user.role === 'seller') &&
    property.agent?._id === user._id;

  const agentInitials = property.agent?.name
    ? property.agent.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AG';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-700 transition-colors">Properties</Link>
        <span>›</span>
        <Link to={`/?city=${property.location?.city}`} className="hover:text-slate-700 transition-colors">
          {property.location?.city}
        </Link>
        <span>›</span>
        <span className="text-amber-500 font-medium truncate">{property.title}</span>
      </nav>

      {/* ── Gallery ── */}
      <ImageGallery images={property.images} />

      {/* ── Two-column content ── */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title + price */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-slate-900">{property.title}</h1>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                For Sale
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">£{property.price?.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <PinIcon />
              {property.location?.address}, {property.location?.city} {property.location?.postcode}
            </div>
          </div>

          {/* ── Spec row ── */}
          <div className="grid grid-cols-4 gap-4 border-y border-slate-100 py-4">
            {[
              { icon: <BedIcon />,  label: 'Bedrooms',  val: property.bedrooms },
              { icon: <BathIcon />, label: 'Bathrooms', val: property.bathrooms },
              { icon: <SqftIcon />, label: 'Sq ft',     val: property.sqft ? property.sqft.toLocaleString() : '—' },
              { icon: <TypeIcon />, label: 'Type',       val: property.propertyType, cap: true },
            ].map(({ icon, label, val, cap }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                {icon}
                <p className={`font-bold text-slate-900 text-lg ${cap ? 'capitalize' : ''}`}>{val}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Description ── */}
          <div>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {property.aiDescription || property.description || 'No description available for this property.'}
            </p>
          </div>

          {/* ── AI Insights panel (always visible) ── */}
          <div className="bg-slate-900 rounded-2xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-black">AI</span>
                </div>
                <span className="font-bold">AI Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Powered by Claude</span>
                <button
                  onClick={fetchValuation}
                  disabled={loadingVal}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Valuation result */}
            {loadingVal && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin"/>
                Analysing with Claude…
              </div>
            )}

            {valuation && valuationExpanded && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${VERDICT_STYLES[valuation.verdict] ?? 'text-slate-300 bg-slate-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {valuation.verdict}
                  {valuation.confidence && (
                    <span className="ml-auto font-normal opacity-60 text-xs">
                      {valuation.confidence}% confidence
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{valuation.marketTrend}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800 rounded-xl p-3">
                    <p className="text-slate-400">Est. price / sqft</p>
                    <p className="font-bold text-white">£{valuation.pricePerSqFt}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3">
                    <p className="text-slate-400">Rental yield</p>
                    <p className="font-bold text-white">{valuation.rentalYield}</p>
                  </div>
                </div>
                <p className="text-amber-400 text-xs italic">{valuation.recommendation}</p>
              </div>
            )}

            {!valuation && !loadingVal && (
              <button
                onClick={fetchValuation}
                className="text-sm text-slate-400 hover:text-amber-400 transition-colors underline underline-offset-2"
              >
                Run AI valuation analysis →
              </button>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Book a Viewing card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">Book a Viewing</h3>

            {/* Agent info */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                {agentInitials}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{property.agent?.name ?? 'Meridian Agent'}</p>
                <p className="text-xs text-slate-400">Senior Agent · Meridian {property.location?.city}</p>
              </div>
            </div>

            {/* Inquiry form */}
            <InquiryForm propertyId={id} />

            {/* AI Description — visible to owners */}
            {isOwner && (
              <div className="pt-3 border-t border-slate-100">
                <AIDescriptionGenerator
                  propertyId={id}
                  onGenerated={(desc) => setProperty((p) => ({ ...p, aiDescription: desc }))}
                />
              </div>
            )}
          </div>

          {/* Mortgage Calculator */}
          <MortgageCalculator defaultPrice={property.price} />
        </div>
      </div>
    </div>
  );
}
