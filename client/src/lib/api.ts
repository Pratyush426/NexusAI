/**
 * Central API helper — attaches JWT Authorization header to every request.
 * Uses relative paths (/api/...) so Vite's proxy forwards to localhost:3000.
 * For production, set VITE_API_URL to your deployed backend URL.
 */

const API_URL = (import.meta.env.VITE_API_URL as string) || '';

const getToken = () => localStorage.getItem('nexusai_token');

const authHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
});

const handleResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
            return {
                success: false,
                message: data.message || `Request failed with status ${res.status}`,
                error: data.error || null,
            };
        }
        return data;
    } else {
        const text = await res.text();
        return {
            success: false,
            message: !res.ok ? `Server error ${res.status}: ${text.slice(0, 100)}` : 'Invalid response format',
        };
    }
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const apiRegister = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
};

export const apiLogin = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
};

export const apiGetMe = async () => {
    try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

// ── Emails (Gmail sync) ───────────────────────────────────────────────────────

export const apiSaveEmail = async (emailData: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/api/create`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(emailData),
    });
    return handleResponse(res);
};

export const apiGetEmails = async () => {
    const res = await fetch(`${API_URL}/api/emails`, {
        headers: authHeaders(),
    });
    return handleResponse(res);
};

// ── User Profile ──────────────────────────────────────────────────────────────

export const apiGetProfile = async () => {
    try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

export const apiUpdateProfile = async (profileData: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/api/users/sync`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(profileData),
    });
    return handleResponse(res);
};

// ── Applications (manual) ─────────────────────────────────────────────────────

export const apiGetApplications = async () => {
    const res = await fetch(`${API_URL}/api/applications`, {
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export const apiCreateApplication = async (appData: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(appData),
    });
    return handleResponse(res);
};

export const apiDeleteApplication = async (id: string) => {
    const res = await fetch(`${API_URL}/api/applications/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleResponse(res);
};

export { API_URL };
