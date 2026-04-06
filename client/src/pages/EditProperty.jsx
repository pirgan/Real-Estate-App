/**
 * pages/EditProperty.jsx
 *
 * Edit form for an existing property listing, accessible to the owning
 * agent or seller via /edit-property/:id.
 *
 * On mount:
 *   Fetches GET /api/properties/:id and pre-populates the form fields.
 *
 * Editable fields:
 *   title, price, bedrooms, bathrooms, description, city, postcode
 *   (Images are managed separately via Cloudinary; full re-upload is out of scope here.)
 *
 * On submit:
 *   Calls PUT /api/properties/:id with the updated fields.
 *   On success — shows a toast and navigates to the property detail page.
 *   On failure — shows the server error in a toast.
 *
 * State:
 *   form    — editable snapshot of the property fields
 *   loading — page-level loading while the initial fetch is running
 *   saving  — disables the Save button while the PUT request is in-flight
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios.js';

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/properties/${id}`)
      .then(({ data }) =>
        setForm({
          title: data.title,
          description: data.description,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          propertyType: data.propertyType,
          location: data.location,
        })
      )
      .finally(() => setLoading(false));
  }, [id]);

  const setTop = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setLoc = (k, v) => setForm((f) => ({ ...f, location: { ...f.location, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/properties/${id}`, form);
      toast.success('Listing updated!');
      navigate(`/properties/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-32 text-slate-400">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Listing</h1>

      <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 space-y-5">
        {[
          { label: 'Title', key: 'title' },
          { label: 'Price (£)', key: 'price', type: 'number' },
          { label: 'Bedrooms', key: 'bedrooms', type: 'number' },
          { label: 'Bathrooms', key: 'bathrooms', type: 'number' },
        ].map(({ label, key, type = 'text' }) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{label}</span>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setTop(key, type === 'number' ? Number(e.target.value) : e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
        ))}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setTop('description', e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">City</span>
          <input
            type="text"
            value={form.location?.city ?? ''}
            onChange={(e) => setLoc('city', e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Postcode</span>
          <input
            type="text"
            value={form.location?.postcode ?? ''}
            onChange={(e) => setLoc('postcode', e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-semibold py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
