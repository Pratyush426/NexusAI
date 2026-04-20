/**
 * Central API helper — attaches JWT Authorization header to every request.
 * Uses relative paths (/api/...) so Vite's proxy forwards to localhost:3000.
 * For production, set VITE_API_URL to your deployed backend URL.
 */

const API_URL = import.meta.env.VITE_API_URL || '';  // Empty = relative (uses Vite proxy in dev)

const getToken = () => localStorage.getItem('jobtrack_token');

const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const apiRegister = async (name, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    return res.json();
};

export const apiLogin = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
};

export const apiGetMe = async () => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: authHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
};

// ── Emails (Gmail sync) ───────────────────────────────────────────────────────

export const apiSaveEmail = async (emailData) => {
    const res = await fetch(`${API_URL}/api/create`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(emailData),
    });
    return res.json();
};

export const apiGetEmails = async () => {
    const res = await fetch(`${API_URL}/api/emails`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch emails');
    return res.json();
};

// ── User Profile ──────────────────────────────────────────────────────────────

export const apiGetProfile = async () => {
    const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: authHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
};

export const apiUpdateProfile = async (profileData) => {
    const res = await fetch(`${API_URL}/api/users/sync`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
};

// ── Applications (manual) ─────────────────────────────────────────────────────
// Manual applications also go to your MongoDB backend (same as Gmail emails)

export const apiCreateApplication = async (appData) => {
    const res = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(appData),
    });
    if (!res.ok) throw new Error('Failed to create application');
    return res.json();
};

export const apiDeleteApplication = async (id) => {
    const res = await fetch(`${API_URL}/api/applications/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete application');
    return res.json();
};

export { API_URL };
