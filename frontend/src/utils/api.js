import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

console.log("🌐 API URL:", baseURL);

const api = axios.create({
  baseURL,
  timeout: 20000
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("📡 REQUEST:", config.url);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ RESPONSE INTERCEPTOR (🔥 FIX HERE)
api.interceptors.response.use(
  (res) => {
    console.log("📥 RESPONSE:", res.data);
    return res;
  },
  (err) => {
    const status = err.response?.status;

    console.log("❌ API ERROR FULL:", {
      message: err.message,
      response: err.response?.data,
      status
    });

    // 🚨 AUTO REDIRECT WHEN TOKEN EXPIRED
    if (status === 401 || status === 403) {
      console.log("🔴 Token expired → redirect login");

      // clear token
      localStorage.removeItem("token");

      // redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default api;