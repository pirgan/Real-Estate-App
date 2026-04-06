/**
 * components/AgentRoute.jsx
 *
 * Route guard that restricts access to users with role === 'agent'.
 *
 * Behaviour:
 *   - Renders a loading indicator while auth state is being resolved.
 *   - Unauthenticated users are redirected to /login.
 *   - Authenticated users without the 'agent' role are redirected to /.
 *   - Only agents see the wrapped component (e.g. AgentDashboard).
 *
 * Usage:
 *   <Route path="/dashboard" element={<AgentRoute><AgentDashboard /></AgentRoute>} />
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Allows only users with role 'agent' through; others are redirected to /.
export default function AgentRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex justify-center py-20 text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'agent') return <Navigate to="/" replace />;

  return children;
}
