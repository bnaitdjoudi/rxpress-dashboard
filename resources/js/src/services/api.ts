const API_URL = '/api';

// Fonction helper pour les requêtes fetch
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/boxed-signin';
        throw data;
    }

    if (!response.ok) {
        throw data;
    }

    return data;
};

// Auth API
export const authApi = {
    login: async (email: string, password: string) => {
        const data = await fetchApi('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        // Stocker le token
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    },

    logout: async () => {
        try {
            await fetchApi('/logout', { method: 'POST' });
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    getUser: async () => {
        return fetchApi('/user');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
};

export default fetchApi;
