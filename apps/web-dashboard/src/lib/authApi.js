const getApiUrl = () => import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export function getAuthStorage() {
    return {
        getAccessToken: () => localStorage.getItem('accessToken'),
        getRefreshToken: () => localStorage.getItem('refreshToken'),
        getSessionId: () => localStorage.getItem('sessionId'),
        setTokens: (data) => {
            if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            if (data.sessionId != null) localStorage.setItem('sessionId', data.sessionId);
        },
        clear: () => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('sessionId');
        }
    };
}

export async function authFetch(path, options = {}) {
    const base = getApiUrl();
    const url = path.startsWith('http') ? path : `${base}${path}`;
    const storage = getAuthStorage();
    let accessToken = storage.getAccessToken();

    const doRequest = (token) => {
        const headers = {
            ...options.headers,
            'Content-Type': 'application/json'
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        return fetch(url, { ...options, headers });
    };

    let res = await doRequest(accessToken);

    if (res.status === 401 && accessToken) {
        const refreshToken = storage.getRefreshToken();
        const sessionId = storage.getSessionId();
        if (refreshToken && sessionId) {
            const refreshRes = await fetch(`${base}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken, sessionId })
            });
            const refreshData = await refreshRes.json();
            if (refreshRes.ok && refreshData.accessToken) {
                storage.setTokens({
                    accessToken: refreshData.accessToken,
                    refreshToken: refreshData.refreshToken,
                    sessionId: refreshData.sessionId ?? sessionId
                });
                return doRequest(refreshData.accessToken);
            }
        }
        storage.clear();
    }

    return res;
}

export async function logoutApi() {
    const base = getApiUrl();
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
        try {
            await fetch(`${base}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
        } catch {
            // Best-effort session revocation -- log out locally regardless of network/API errors

        }
    }
    getAuthStorage().clear();
}
