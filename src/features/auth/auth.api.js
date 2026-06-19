import api from '@/lib/axios';

export const login = (payload) => api.post('/auth/login', payload).then((res) => res.data.data);

export const registerTenant = (payload) => api.post('/auth/register-tenant', payload).then((res) => res.data.data);

export const refresh = () => api.post('/auth/refresh').then((res) => res.data.data);

export const logout = () => api.post('/auth/logout').then((res) => res.data);

export const getMe = () => api.get('/auth/me').then((res) => res.data.data.user);

export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload).then((res) => res.data);

export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then((res) => res.data);

export const changePassword = (payload) => api.post('/auth/change-password', payload).then((res) => res.data.data);
