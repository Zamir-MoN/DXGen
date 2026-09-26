import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Attach Authorization header if JWT token is stored
api.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem('dxgen_token');
  if (token && reqConfig.headers) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

// Standardized error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.error?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(errorMsg));
  }
);
