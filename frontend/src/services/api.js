import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
// Backend origin = API base minus the trailing /api, used to resolve
// relative paths like "/uploads/products/xxx.jpg" returned by the server.
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

// Resolve a possibly-relative image path (e.g. "/uploads/products/x.jpg")
// into a full URL pointing at the backend. Leaves already-absolute URLs
// (http://, https://) and local frontend assets (e.g. "/img/...") untouched.
export function getImageUrl(path) {
  if (!path) return '/img/no-image.svg';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/img/')) return path; // local frontend static asset
  return BACKEND_ORIGIN + path;
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach user token
api.interceptors.request.use((config) => {
  // Check if this is an admin request
  const isAdminReq = config.url?.includes('/admin');
  const tokenKey = isAdminReq ? 'admin_token' : 'lensique_token';
  const token = localStorage.getItem(tokenKey);

  // For non-admin requests, also try user token
  if (!token && !isAdminReq) {
    const userToken = localStorage.getItem('lensique_token');
    if (userToken) config.headers.Authorization = `Bearer ${userToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData (let browser set multipart boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Handle 401/403 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Determine if admin or user context
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (path !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.removeItem('lensique_token');
        localStorage.removeItem('lensique_user');
        if (path !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
