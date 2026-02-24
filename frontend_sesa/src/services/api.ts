import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://projeto-sesa-ilbqb5u4a-deivisnans-projects.vercel.app/api',
});

api.interceptors.request.use((config) => {
    // Apenas no lado do cliente
    if (typeof window !== 'undefined') {
        const token = Cookies.get('sysfarma.token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
