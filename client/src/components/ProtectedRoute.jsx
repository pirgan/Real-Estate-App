/**
 * components/ProtectedRoute.jsx
 *
 * Route guard that ensures a user is authenticated before rendering children.
 *
 * Behaviour:
 *   - While AuthContext is still verifying the stored token (loading === true),
 *     renders a neutral loading indicator to avoid a premature redirect.
 *   - Once loading is complete, redirects to /login if no user is present.
 *   - Otherwise renders the wrapped page component as-is.
 *
 * Usage:
 *   <Route path="/saved" element={<ProtectedRoute><SavedProperties /></ProtectedRoute>} />
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Redirects unauthenticated users to /login while preserving the intended destination.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex justify-center py-20 text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
