/**
 * api/axios.js
 *
 * Configured Axios instance used by every page and component to communicate
 * with the Express backend.  All requests are sent to the /api prefix, which
 * Vite proxies to http://localhost:5000 in development and hits the deployed
 * server in production.
 *
 * Two interceptors are registered:
 *  - Request  — injects the stored JWT as a Bearer token so protected routes
 *                work automatically without callers having to set the header.
 *  - Response — clears a stale token from localStorage when the server returns
 *                401, so the user is cleanly logged out on the next navigation.
 */
import axios from 'axios';

// Base instance — all relative paths will be prefixed with /api
const api = axios.create({
  baseURL: '/api',
});

// Attach JWT from localStorage to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 responses clear the stored token so the UI can redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export default api;
