import axios from 'axios';
import useAuthStore from '@/store/authStore';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, null, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().setAuth(data.data);
        return data.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthEndpoint = config?.url?.startsWith('/auth/');

    // Subscription lapsed, or the tenant's plan lacks a gated feature — hard
    // redirect so the router guard picks it up. Stash the server's reason so
    // SubscriptionPage can explain why the user landed there (a full
    // navigation discards any toast fired before `replace`).
    if (response?.status === 402 && !isAuthEndpoint) {
      sessionStorage.setItem(
        'subscriptionRedirectReason',
        JSON.stringify({ code: response.data?.code, message: response.data?.message })
      );
      window.location.replace('/app/subscription');
      return Promise.reject(error);
    }

    if (response?.status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
