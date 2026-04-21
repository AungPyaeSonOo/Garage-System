import axios from "axios";

// ✅ safer config (remove trailing slash issues)
const baseURL =
  (import.meta.env.VITE_API_URL ||
  "https://garage-system-production-e9c1.up.railway.app").replace(/\/$/, "");

console.log("API BASE URL:", baseURL);

const api = axios.create({
  baseURL,
  timeout: 15000, // ✅ prevent hanging requests
  headers: {
    "Content-Type": "application/json"
  }
});

// =====================
// ✅ REQUEST INTERCEPTOR
// =====================
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

// =====================
// ✅ RESPONSE HANDLER
// =====================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("❌ API ERROR:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    // only logout on real auth failure
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;