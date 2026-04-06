/**
 * pages/CreateProperty.jsx
 *
 * Four-step listing wizard matching the design reference (s4-create-edit-property.png).
 *
 * Steps (horizontal progress bar):
 *   1 — Property Info   title (char counter), type, price, bedroom/bathroom steppers
 *   2 — Location        address, city, postcode, lat/lng
 *   3 — Photos          add by URL, thumbnail preview
 *   4 — Review & Publish read-only summary + publish button
 *
 * Right panel: live preview card that updates as the user types.
 * Navigation: dark navy "Continue" button; completed steps show a filled circle.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios.js';

const TITLE_MAX = 80;

const STEPS = [
  { label: 'Property Info' },
  { label: 'Location' },
  { label: 'Photos' },
  { label: 'Review & Publish' },
];

const TYPES = ['house', 'flat', 'studio', 'commercial'];

const INITIAL = {
  title: '', description: '', price: '', bedrooms: 1, bathrooms: 1,
  propertyType: 'house',
  location: { address: '', city: '', postcode: '', lat: '', lng: '' },
  images: [],
};

// ── Stepper component ─────────────────────────────────────────────────────────
function Stepper({ label, value, onChange, min = 0 }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-medium mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:border-slate-900 hover:bg-slate-50 font-bold text-lg"
        >
          −
        </button>
        <span className="font-black text-slate-900 text-2xl w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:border-slate-900 hover:bg-slate-50 font-bold text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Live preview card ─────────────────────────────────────────────────────────
function PreviewCard({ form }) {
  const thumb = form.images[0]?.url;
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32 bg-slate-100 flex items-center justify-center text-slate-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </div>
        )}
        {form.price && (
          <div className="relative -mt-5 ml-3 inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg">
            £{Number(form.price).toLocaleString()}
          </div>
        )}
        <div className="p-3">
          <p className="font-bold text-slate-900 text-sm leading-tight">
            {form.title || <span className="text-slate-300">Your title here…</span>}
          </p>
          {(form.location.city || form.location.address) && (
            <p className="text-xs text-slate-500 mt-0.5">
              {form.location.address && `${form.location.address}, `}{form.location.city}
            </p>
          )}
          {(form.bedrooms || form.bathrooms) && (
            <p className="text-xs text-slate-400 mt-1">
              {form.bedrooms} beds · {form.bathrooms} baths
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-amber-600 font-medium text-center">
        Preview updates as you complete each step.
      </p>
    </div>
  );
}

export default function CreateProperty() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const setTop = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setLoc = (k, v) => setForm((f) => ({ ...f, location: { ...f.location, [k]: v } }));

  const addImage = () => {
    if (!imageUrl.trim()) return;
    setForm((f) => ({ ...f, images: [...f.images, { url: imageUrl.trim(), caption: '' }] }));
    setImageUrl('');
  };

  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const publish = async () => {
    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      const { data } = await api.post('/properties', payload);
      toast.success('Listing published!');
      navigate(`/properties/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top bar ── */}
      <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 rounded-md flex items-center justify-center">
            <span className="text-white font-black text-xs">M</span>
          </div>
          <span className="text-white font-bold tracking-widest text-sm uppercase">Meridian</span>
        </div>
        <h2 className="text-white font-semibold text-sm">New Listing</h2>
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
          × Cancel
        </button>
      </div>

      {/* ── Horizontal step progress bar ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-4">
        <div className="max-w-xl mx-auto flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex-1 flex items-center">
              {/* Circle */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < step
                      ? 'bg-slate-900 text-white'
                      : i === step
                      ? 'bg-amber-500 text-slate-900 ring-4 ring-amber-100'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${i === step ? 'text-slate-800' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 mt-[-14px] ${i < step ? 'bg-slate-900' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-4xl mx-auto px-6 py-8 grid lg:grid-cols-5 gap-8">

        {/* Form area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow p-6 space-y-6">

            {/* Step 0 — Property Info */}
            {step === 0 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Property Information</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Tell us about the property. This appears in your public listing.</p>
                </div>

                {/* Title + char counter */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-700">Listing Title</label>
                    <span className={`text-xs ${form.title.length > TITLE_MAX ? 'text-rose-500' : 'text-slate-400'}`}>
                      {form.title.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setTop('title', e.target.value.slice(0, TITLE_MAX))}
                    placeholder="Chelsea Townhouse with Garden"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Type + Price row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Property Type</label>
                    <select
                      value={form.propertyType}
                      onChange={(e) => setTop('propertyType', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none bg-white"
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Price (£)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setTop('price', e.target.value)}
                        placeholder="675,000"
                        className="w-full border border-slate-200 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Bedroom / Bathroom steppers */}
                <div className="grid grid-cols-2 gap-8">
                  <Stepper label="Bedrooms" value={form.bedrooms} onChange={(v) => setTop('bedrooms', v)} min={0} />
                  <Stepper label="Bathrooms" value={form.bathrooms} onChange={(v) => setTop('bathrooms', v)} min={0} />
                </div>
              </>
            )}

            {/* Step 1 — Location */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Location</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Where is the property located?</p>
                </div>
                {[
                  { label: 'Street Address', key: 'address', placeholder: '14 Beaufort Street' },
                  { label: 'City',    key: 'city',    placeholder: 'Chelsea' },
                  { label: 'Postcode', key: 'postcode', placeholder: 'SW3 5NL' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">{label}</label>
                    <input
                      type="text"
                      value={form.location[key]}
                      onChange={(e) => setLoc(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Latitude (optional)</label>
                    <input type="number" value={form.location.lat} onChange={(e) => setLoc('lat', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Longitude (optional)</label>
                    <input type="number" value={form.location.lng} onChange={(e) => setLoc('lng', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Photos */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Photos</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Add Cloudinary image URLs for your listing.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/…"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button onClick={addImage} type="button"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl text-sm">
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden h-24 bg-slate-100">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} type="button"
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80">
                        ×
                      </button>
                    </div>
                  ))}
                  {form.images.length === 0 && (
                    <div className="col-span-3 h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                      No photos added yet
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Review & Publish</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Check your listing before it goes live.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-700">
                  <p><strong>Title:</strong> {form.title}</p>
                  <p><strong>Type:</strong> {form.propertyType}</p>
                  <p><strong>Price:</strong> £{Number(form.price).toLocaleString()}</p>
                  <p><strong>Bedrooms:</strong> {form.bedrooms} · <strong>Bathrooms:</strong> {form.bathrooms}</p>
                  <p><strong>Address:</strong> {form.location.address}, {form.location.city} {form.location.postcode}</p>
                  <p><strong>Photos:</strong> {form.images.length}</p>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="text-slate-500 hover:text-slate-800 disabled:opacity-30 text-sm font-medium flex items-center gap-1"
              >
                ← Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-colors"
                >
                  Continue to {STEPS[step + 1].label} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={publish}
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                >
                  {loading ? 'Publishing…' : 'Publish Listing'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live preview panel */}
        <div className="lg:col-span-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Live preview</p>
          <PreviewCard form={form} />
        </div>
      </div>
    </div>
  );
}
