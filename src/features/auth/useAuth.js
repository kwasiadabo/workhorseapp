import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/store/authStore';
import * as authApi from './auth.api';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => setAuth(data),
  });
};

export const useRegisterTenant = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authApi.registerTenant,
    onSuccess: (data) => setAuth(data),
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      navigate('/login', { replace: true });
    },
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationFn: authApi.forgotPassword,
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: authApi.resetPassword,
  });

export const useChangePassword = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (data) => setAuth(data),
  });
};
