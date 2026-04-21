import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

console.log("🌐 API URL:", baseURL);

const api = axios.create({
  baseURL,
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  console.log("📡 REQUEST:", config.url);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log("📥 RESPONSE:", res.data);
    return res;
  },
  (err) => {
    console.log("❌ API ERROR FULL:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });

    return Promise.reject(err);
  }
);

export default api;