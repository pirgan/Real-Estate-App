/**
 * components/InquiryForm.jsx
 *
 * Contact form displayed on the PropertyDetail page allowing a buyer to
 * send a message directly to the listing agent.
 *
 * Behaviour:
 *   - Unauthenticated visitors see a prompt to log in instead of the form.
 *   - On submit, calls POST /api/inquiries/properties/:propertyId.
 *   - Shows a success banner after the first send and hides the form.
 *   - Error and success states are communicated via react-toastify.
 *
 * Props:
 *   propertyId — MongoDB _id of the property being inquired about
 */
import { useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

export default function InquiryForm({ propertyId }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) {
    return (
      <p className="text-sm text-slate-500">
        Please <a href="/login" className="text-amber-600 underline">log in</a> to send an inquiry.
      </p>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post(`/inquiries/properties/${propertyId}`, { message });
      setSent(true);
      setMessage('');
      toast.success('Inquiry sent!');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to send inquiry');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
        Your inquiry has been sent. The agent will be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-bold text-slate-800">Send an Inquiry</h3>
      <textarea
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hi, I'd like to arrange a viewing..."
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
      />
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-semibold py-2.5 rounded-xl transition-colors"
      >
        {sending ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
