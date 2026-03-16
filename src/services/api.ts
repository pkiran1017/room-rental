import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
            delete (config.headers as Record<string, unknown>)['Content-Type'];
            delete (config.headers as Record<string, unknown>)['content-type'];
        }

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            const token = localStorage.getItem('token');

            // Only force logout/redirect if a token exists (expired/invalid).
            if (token) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Generic API methods
export const get = async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.get<T>(url, config);
    return response.data;
};

export const post = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.post<T>(url, data, config);
    return response.data;
};

export const put = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.put<T>(url, data, config);
    return response.data;
};

export const patch = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await api.patch<T>(url, data, config);
    return response.data;
};

export const del = async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.delete<T>(url, config);
    return response.data;
};

export default api;
