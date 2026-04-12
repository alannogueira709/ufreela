import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle global errors (e.g., redirect to login on 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // We can add logic to try to refresh the token via /api/users/refresh/ endpoint here
    // or properly catch 401 and clear local user state.
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Assume backend has a /refresh endpoint that reads the refresh_token cookie
        // and sets a new access_token cookie
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, it means session is expired.
        // We can emit an event or rely on components handling the throw.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("unauthorized"));
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
