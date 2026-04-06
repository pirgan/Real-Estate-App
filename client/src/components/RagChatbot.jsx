/**
 * components/RagChatbot.jsx
 *
 * Right-side drawer chatbot matching the design reference (s7-rag-chatbot.png).
 *
 * Layout:
 *   - Gold circle toggle button fixed bottom-right
 *   - Wide slide-in panel from the right edge (~380px), full-height
 *   - Header: "Meridian Assistant" + "AI-powered · Powered by Claude" + close ×
 *   - Messages: dark circle avatar (M logo) on assistant messages, right-aligned
 *     dark navy bubble for user messages
 *   - Citation pills below each assistant reply
 *   - Animated typing indicator (three bouncing dots)
 *   - Input bar at the bottom with arrow send button
 */
import { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';

// Meridian "M" avatar for assistant messages
const MAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
    <span className="text-amber-400 font-black text-xs">M</span>
  </div>
);

export default function RagChatbot() {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState('');
  const [history, setHistory] = useState([]);
  const [typing,  setTyping]  = useState(false);
  const bottomRef = useRef(null);

  // Scroll to newest message whenever history or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, typing]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || typing) return;

    setInput('');
    setHistory((h) => [...h, { role: 'user', content: msg }]);
    setTyping(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: msg,
        history: history.map(({ role, content }) => ({ role, content })),
      });
      setHistory((h) => [...h, {
        role: 'assistant',
        content: data.reply,
        citations: data.citations,
      }]);
    } catch {
      setHistory((h) => [...h, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setTyping(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 shadow-xl flex items-center justify-center text-slate-900 transition-colors"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        )}
      </button>

      {/* ── Drawer panel ── */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
          <MAvatar />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Meridian Assistant</p>
            <p className="text-slate-400 text-xs">AI-powered · Powered by Claude</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50">
          {/* Welcome message */}
          {history.length === 0 && (
            <div className="flex gap-3">
              <MAvatar />
              <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Meridian Assistant</p>
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-slate-700 leading-relaxed">
                  Hello! I'm your Meridian property assistant. I can help you with buying guides,
                  mortgage advice, local area information, and finding your perfect home. What would
                  you like to know?
                </div>
                {/* Starter citation pills */}
                <div className="flex flex-wrap gap-1.5">
                  {['buyer-guide.md', 'mortgage-guide.md'].map((s) => (
                    <span key={s} className="bg-white border border-slate-200 text-slate-500 text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && <MAvatar />}

              <div className={`flex flex-col gap-1.5 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'assistant' && (
                  <p className="text-xs font-semibold text-slate-500">Meridian Assistant</p>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-700 shadow-sm rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Citation pills */}
                {msg.citations?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, j) => (
                      <span key={j} className="bg-white border border-slate-200 text-slate-500 text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                        {c.source.replace('.md', '')}
                        {c.section ? ` › ${c.section}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-3">
              <MAvatar />
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-slate-200 bg-white px-3 py-3 flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about buying, selling, mortgages, or local…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400"
          />
          <button
            onClick={send}
            disabled={typing || !input.trim()}
            className="w-10 h-10 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
