import axios from "axios";

// ✅ FIX: always use Railway backend in production
const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://garage-system-production-e9c1.up.railway.app";

console.log("API BASE URL:", baseURL);

const api = axios.create({
  baseURL
});

// Add token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;