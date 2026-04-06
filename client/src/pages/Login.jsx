/**
 * pages/Login.jsx
 *
 * Combined authentication page — single card with "Log In" / "Register" tab
 * toggle to match the design reference (s1-login-register.png).
 *
 * Routes /login and /register both render this component; the active tab is
 * derived from the current pathname on mount so deep-linking to /register
 * opens the registration form directly.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = ['buyer', 'seller', 'agent'];

// ── small icon helpers ────────────────────────────────────────────────────────
const EnvelopeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
  </svg>
);
const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
  </svg>
);
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

// Reusable icon-prefixed input field
function IconInput({ icon, ...props }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        {...props}
        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
      />
    </div>
  );
}

// Reusable icon-prefixed select
function IconSelect({ icon, children, ...props }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <select
        {...props}
        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none bg-white"
      >
        {children}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </span>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive initial tab from pathname so /register opens the register form
  const [tab, setTab] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const setL = (k, v) => setLoginForm((f) => ({ ...f, [k]: v }));

  // Register form state
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const setR = (k, v) => setRegForm((f) => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', loginForm);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', regForm);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-base leading-none">M</span>
          </div>
          <h1 className="text-xl font-black tracking-[0.2em] text-slate-900 uppercase">Meridian</h1>
          <p className="text-slate-400 text-xs">Your trusted partner in premium property</p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl border border-slate-200 p-1">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${
                tab === t ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t === 'login' ? 'Log In' : 'Register'}
            </button>
          ))}
        </div>

        {/* ── Log In form ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email Address</label>
              <IconInput
                icon={<EnvelopeIcon />}
                type="email"
                required
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={(e) => setL('email', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                <button type="button" className="text-amber-500 hover:text-amber-600 text-xs font-medium">
                  Forgot password?
                </button>
              </div>
              <IconInput
                icon={<LockIcon />}
                type="password"
                required
                placeholder="••••••••••"
                value={loginForm.password}
                onChange={(e) => setL('password', e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {loading ? 'Signing in…' : <>Log In to Meridian <span className="text-lg leading-none">→</span></>}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google OAuth placeholder */}
            <button
              type="button"
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button type="button" onClick={() => setTab('register')} className="text-amber-500 font-semibold hover:underline">
                Register free
              </button>
            </p>
          </form>
        )}

        {/* ── Register form ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Full Name</label>
              <IconInput
                icon={<UserIcon />}
                type="text"
                required
                placeholder="James Harrington"
                value={regForm.name}
                onChange={(e) => setR('name', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email Address</label>
              <IconInput
                icon={<EnvelopeIcon />}
                type="email"
                required
                placeholder="you@example.com"
                value={regForm.email}
                onChange={(e) => setR('email', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
              <IconInput
                icon={<LockIcon />}
                type="password"
                required
                placeholder="Min. 6 characters"
                value={regForm.password}
                onChange={(e) => setR('password', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">I am a…</label>
              <IconSelect icon={<UserIcon />} value={regForm.role} onChange={(e) => setR('role', e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </IconSelect>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              {loading ? 'Creating account…' : <>Create Account <span className="text-lg leading-none">→</span></>}
            </button>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={() => setTab('login')} className="text-amber-500 font-semibold hover:underline">
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
