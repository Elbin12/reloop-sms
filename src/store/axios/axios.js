import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// axiosBaseQuery.js
export const axiosBaseQuery =
  ({ baseUrl = '' } = {}) =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + (url || ''),
        method,
        data,
        params,
      });
      console.log(result.data, 'dd');
      
      return { data: result.data };
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message,
        },
      };
    }
  };


axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access');    

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/service/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access', newAccessToken);

        // Update the original request with new token and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('access');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
