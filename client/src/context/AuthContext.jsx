/**
 * context/AuthContext.jsx
 *
 * Global authentication state for the entire application.
 * Wraps the component tree with <AuthProvider> so any child can call
 * useAuth() to read the current user or trigger login/logout.
 *
 * State kept here:
 *   user    — the full User document returned by the server (null when logged out)
 *   token   — the raw JWT string persisted in localStorage
 *   loading — true while the app is verifying an existing token on first load
 *
 * On mount, if a token exists in localStorage, the provider calls GET /auth/me
 * to rehydrate the user object; this prevents a logged-in user from seeing a
 * blank state on page refresh.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Initialise token from localStorage so the Axios interceptor is ready immediately
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  // Prevents protected routes from flashing the login redirect before the /me call resolves
  const [loading, setLoading] = useState(true);

  // On mount restore user from token stored in localStorage
  useEffect(() => {
    if (token) {
      api
        .get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => logout())      // token is invalid/expired — clear it
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Persists the token and user after a successful login or register response
  const login = (tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    setToken(tokenValue);
    setUser(userData);
  };

  // Clears all auth state and removes the token from storage
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — throws if used outside <AuthProvider>
export const useAuth = () => useContext(AuthContext);
