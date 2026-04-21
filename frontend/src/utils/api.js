import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://garage-system-production-e9c1.up.railway.app";

console.log("API BASE URL:", baseURL);

const api = axios.create({
  baseURL
});

// ✅ attach token
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

// ✅ handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;