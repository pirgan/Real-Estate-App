/**
 * pages/MyInquiries.jsx
 *
 * Inquiry thread view for buyers — lists all inquiries the authenticated user
 * has submitted, newest first.
 *
 * Data fetching:
 *   GET /api/inquiries/my — returns the buyer's own inquiries with the related
 *   property (title, price, location) populated.
 *
 * Each card shows:
 *   - Property title (linked to the detail page)
 *   - Submission date
 *   - Status badge: new (blue) | replied (green) | closed (grey)
 *   - The buyer's original message in a slate box
 *   - The agent's reply in an amber box (only rendered when agentReply is set)
 *
 * This page is protected — unauthenticated users are redirected to /login.
 */
import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  replied: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

export default function MyInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/inquiries/my')
      .then(({ data }) => setInquiries(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Inquiries</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <p className="text-center text-slate-400 py-20">You haven't sent any inquiries yet.</p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq._id} className="bg-white rounded-2xl shadow p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    to={`/properties/${inq.property?._id}`}
                    className="font-semibold text-slate-800 hover:text-amber-600 transition-colors"
                  >
                    {inq.property?.title ?? 'Property'}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(inq.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[inq.status]}`}>
                  {inq.status}
                </span>
              </div>

              {/* Your message */}
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">
                <p className="text-xs font-medium text-slate-400 mb-1">Your message</p>
                {inq.message}
              </div>

              {/* Agent reply thread */}
              {inq.agentReply && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-slate-700">
                  <p className="text-xs font-medium text-amber-600 mb-1">Agent reply</p>
                  {inq.agentReply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
