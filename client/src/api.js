const API_BASE = '';

export function getAuth() {
    return {
        submissionId: localStorage.getItem('submissionId'),
        accessToken: localStorage.getItem('accessToken'),
    };
}

export function setAuth(submissionId, accessToken) {
    localStorage.setItem('submissionId', submissionId);
    localStorage.setItem('accessToken', accessToken);
}

export function clearAuth() {
    localStorage.removeItem('submissionId');
    localStorage.removeItem('accessToken');
}

function authHeaders() {
    const { submissionId, accessToken } = getAuth();
    return {
        'X-Submission-Id': submissionId || '',
        'X-Access-Token': accessToken || '',
    };
}

export async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: authHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export async function apiDelete(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export async function apiUpload(path, formData, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}${path}`);

        const { submissionId, accessToken } = getAuth();
        xhr.setRequestHeader('X-Submission-Id', submissionId || '');
        xhr.setRequestHeader('X-Access-Token', accessToken || '');

        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err.error || 'Upload failed'));
                } catch {
                    reject(new Error('Upload failed'));
                }
            }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
    });
}
