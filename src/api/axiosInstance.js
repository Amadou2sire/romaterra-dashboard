import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

let refreshRequest = null;

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("isConnected");
  localStorage.removeItem("adminName");
  localStorage.removeItem("adminRole");

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

// Attach the auth token to every request automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const requestUrl = request?.url || "";
    const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh");

    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = axiosInstance
          .post("/auth/refresh", { refreshToken })
          .finally(() => {
            refreshRequest = null;
          });
      }

      const response = await refreshRequest;
      const newAccessToken = response.data.accessToken;
      localStorage.setItem("token", newAccessToken);
      request.headers = request.headers || {};
      request.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(request);
    } catch (refreshError) {
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
