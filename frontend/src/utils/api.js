import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL,
  timeout: 20000
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  console.log("📡 REQUEST:", config.url);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ RESPONSE INTERCEPTOR (AUTO REFRESH TOKEN)
api.interceptors.response.use(
  (res) => {
    console.log("📥 RESPONSE:", res.data);
    return res;
  },
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;

    console.log("❌ API ERROR:", status);

    // 🔥 TOKEN EXPIRED → TRY REFRESH
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Trying refresh token...");

        const refreshToken = localStorage.getItem("refreshToken");

        const res = await axios.post(
          `${baseURL}/users/refresh`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;

        console.log("✅ New Access Token:", newAccessToken);

        // Save new token
        localStorage.setItem("accessToken", newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.log("🔴 Refresh failed → logout");

        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;