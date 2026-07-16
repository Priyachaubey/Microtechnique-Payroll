// ── LOCAL DEVELOPMENT ──────────────────────────────────────────
// Use localhost:5125 when running the backend locally.
// For production, we dynamically use the current origin.
// ────────────────────────────────────────────────────────────────
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const DEFAULT_BACKEND_ORIGIN = isLocalhost ? 'http://localhost:5125' : window.location.origin;

export const BACKEND_ORIGIN = DEFAULT_BACKEND_ORIGIN.replace(/\/$/, '');
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;
export const SIGNALR_HUB_URL = `${BACKEND_ORIGIN}/hub/notifications`;
