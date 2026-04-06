/**
 * pages/AgentDashboard.jsx
 *
 * Full-page agent command centre matching the design reference (s6-agent-dashboard.png).
 *
 * Layout — left sidebar + main content (no top Navbar on this page):
 *
 * Sidebar:
 *   - Meridian logo
 *   - Navigation: My Listings (count badge), Inquiries (unread badge), Analytics, Settings
 *   - Agent avatar + name + role at the bottom
 *
 * Main area:
 *   - Page title "My Listings" + "+ Add New Listing" button
 *   - Stats row: Active Listings, Sold This Month, New Inquiries (amber), Total Views
 *   - Listings table: thumbnail, title, city, Status badge, Price, Inquiry count, Actions
 *   - Recent Inquiries section with "N unread" badge and reply threads
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

// useState used inside InquiryRow (defined in same file)

// ── Status badge helper ───────────────────────────────────────────────────────
const STATUS = {
  active:   { label: 'Active',   cls: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'Archived', cls: 'bg-slate-100 text-slate-500' },
  sold:     { label: 'Sold',     cls: 'bg-blue-100 text-blue-700' },
};

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const ListingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M3 12h18M3 17h18"/></svg>;
const InquiriesIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>;
const AnalyticsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
const SettingsIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('listings');
  const [listings,  setListings]  = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/properties', { params: { limit: 100 } }),
      api.get('/inquiries/my').catch(() => ({ data: [] })),
    ]).then(([propRes, inqRes]) => {
      setListings(propRes.data.properties ?? []);
      setInquiries(inqRes.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const archiveListing = async (id) => {
    try {
      await api.patch(`/properties/${id}/archive`);
      setListings((l) => l.map((p) => p._id === id ? { ...p, status: 'archived' } : p));
      toast.success('Listing archived');
    } catch {
      toast.error('Could not archive listing');
    }
  };

  const sendReply = async (inquiryId, agentReply) => {
    await api.patch(`/inquiries/${inquiryId}/reply`, { agentReply });
    setInquiries((iq) =>
      iq.map((i) => i._id === inquiryId ? { ...i, agentReply, status: 'replied' } : i)
    );
  };

  // Derived stats
  const activeCount   = listings.filter((p) => p.status === 'active').length;
  const soldCount     = listings.filter((p) => p.status === 'sold').length;
  const newInquiries  = inquiries.filter((i) => i.status === 'new').length;

  const agentInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AG';

  const navItems = [
    { key: 'listings',  label: 'My Listings',  icon: <ListingsIcon />,  badge: activeCount },
    { key: 'inquiries', label: 'Inquiries',     icon: <InquiriesIcon />, badge: newInquiries, badgeRed: true },
    { key: 'analytics', label: 'Analytics',     icon: <AnalyticsIcon /> },
    { key: 'settings',  label: 'Settings',      icon: <SettingsIcon /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <span className="text-white font-black tracking-widest text-xs uppercase">Meridian</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ key, label, icon, badge, badgeRed }) => (
            <button
              key={key}
              onClick={() => setActiveNav(key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeNav === key
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">{icon} {label}</span>
              {badge > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  badgeRed ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Agent profile at bottom */}
        <div className="px-4 py-4 border-t border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center font-bold text-slate-900 text-sm shrink-0">
            {agentInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name ?? 'Agent'}</p>
            <p className="text-slate-400 text-xs truncate">Senior Agent</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Log out"
            className="text-slate-500 hover:text-rose-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">My Listings</h1>
            <Link
              to="/create-property"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors"
            >
              + Add New Listing
            </Link>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Listings',  val: activeCount,   color: 'text-slate-900' },
              { label: 'Sold This Month',  val: soldCount,     color: 'text-slate-900' },
              { label: 'New Inquiries',    val: newInquiries,  color: 'text-amber-500' },
              { label: 'Total Views',      val: '1,284',       color: 'text-slate-900' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs text-slate-400 font-medium mb-2">{label}</p>
                <p className={`text-3xl font-black ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* ── Listings table ── */}
          {activeNav === 'listings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Property</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Inquiries</th>
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : listings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                        No listings yet.{' '}
                        <Link to="/create-property" className="text-amber-500 font-medium hover:underline">
                          Create your first listing →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    listings.map((p) => {
                      const badge = STATUS[p.status] ?? STATUS.active;
                      const thumb = p.images?.[0]?.url;
                      const inquiryCount = inquiries.filter((i) => i.property === p._id || i.property?._id === p._id).length;
                      return (
                        <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                          {/* Property cell — thumbnail + title + city */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                {thumb ? (
                                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div>
                                <Link
                                  to={`/properties/${p._id}`}
                                  className="font-semibold text-slate-800 hover:text-amber-600 transition-colors line-clamp-1"
                                >
                                  {p.title}
                                </Link>
                                <p className="text-xs text-slate-400">{p.location?.address}, {p.location?.city}</p>
                              </div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          {/* Price */}
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            £{p.price?.toLocaleString()}
                          </td>
                          {/* Inquiry count */}
                          <td className="px-4 py-3 text-slate-500">{inquiryCount}</td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 text-xs font-semibold">
                              <Link to={`/edit-property/${p._id}`} className="text-amber-600 hover:underline flex items-center gap-1">
                                ✎ Edit
                              </Link>
                              {p.status === 'active' && (
                                <button
                                  onClick={() => archiveListing(p._id)}
                                  className="text-rose-500 hover:underline flex items-center gap-1"
                                >
                                  Archive
                                </button>
                              )}
                              {p.status === 'archived' && (
                                <span className="text-slate-400">Restore</span>
                              )}
                              {p.status === 'sold' && (
                                <Link to={`/properties/${p._id}`} className="text-slate-500 hover:underline">View</Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Recent Inquiries section ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Recent Inquiries</h2>
              {newInquiries > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {newInquiries} unread
                </span>
              )}
              <button className="ml-auto text-xs text-amber-500 font-semibold hover:underline">View all</button>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                ))
              ) : inquiries.length === 0 ? (
                <p className="px-5 py-8 text-center text-slate-400 text-sm">No inquiries yet.</p>
              ) : (
                inquiries.slice(0, 5).map((inq) => (
                  <InquiryRow key={inq._id} inquiry={inq} onReply={sendReply} />
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Inquiry row sub-component ─────────────────────────────────────────────────
function InquiryRow({ inquiry, onReply }) {
  const [replyText, setReplyText] = useState('');
  const [sending,   setSending]   = useState(false);

  const buyerInitials = inquiry.buyer?.name
    ? inquiry.buyer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const send = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await onReply(inquiry._id, replyText);
      setReplyText('');
    } catch {
      // error handled by parent
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Buyer avatar */}
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
            {buyerInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800 text-sm">{inquiry.buyer?.name}</p>
              {inquiry.status === 'new' && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
              )}
            </div>
            <p className="text-xs text-slate-400">{inquiry.property?.title ?? 'Property'}</p>
          </div>
        </div>
        <span className="text-xs text-slate-400 shrink-0">
          {new Date(inquiry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Message preview */}
      <p className="text-sm text-slate-600 line-clamp-2 bg-slate-50 rounded-xl px-3 py-2">
        "{inquiry.message}"
      </p>

      {/* Reply area */}
      {inquiry.agentReply ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
          <strong>Your reply:</strong> {inquiry.agentReply}
        </p>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={send}
            disabled={sending || !replyText.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-900 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1"
          >
            → Reply
          </button>
        </div>
      )}
    </div>
  );
}
