/**
 * components/AIDescriptionGenerator.jsx
 *
 * "Generate AI Description" panel shown to agents and sellers on the
 * PropertyDetail page.  Calls the backend Claude endpoint to produce a
 * compelling estate-agent description and previews the result inline.
 *
 * Behaviour:
 *   - Sends POST /api/ai/properties/:id/description (auth required, role: agent|seller).
 *   - Displays the returned description in a violet preview box.
 *   - Calls the optional onGenerated callback so the parent page can update its
 *     local property state without a full refetch.
 *   - Shows a spinner inside the button while the AI request is in flight.
 *
 * Props:
 *   propertyId  — MongoDB _id of the property
 *   onGenerated — optional callback(description: string) invoked after success
 */
import { useState } from 'react';
import api from '../api/axios.js';
import { toast } from 'react-toastify';

// Renders a "Generate Description" button for agents/sellers.
// Calls POST /api/ai/properties/:id/description and streams the result into a preview box.
export default function AIDescriptionGenerator({ propertyId, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  const generate = async () => {
    setLoading(true);
    setPreview('');
    try {
      const { data } = await api.post(`/ai/properties/${propertyId}/description`);
      setPreview(data.description);
      onGenerated?.(data.description);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          <>✨ Generate AI Description</>
        )}
      </button>

      {preview && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {preview}
        </div>
      )}
    </div>
  );
}
