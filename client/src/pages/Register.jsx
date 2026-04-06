/**
 * pages/Register.jsx
 *
 * Register and Login are now combined in Login.jsx as a tabbed card.
 * This module simply redirects /register to /login so any hard-coded
 * links or bookmarks still work.
 */
import { Navigate } from 'react-router-dom';

export default function Register() {
  return <Navigate to="/register" replace />;
}
