import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL,
  timeout: 20000
});

// ================= REQUEST =================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ================= RESPONSE =================
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;

    if (originalRequest._retry) {
      return Promise.reject(err);
    }

    if (status === 401 || status === 403) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const res = await axios.post(`${baseURL}/users/refresh`, {
          refreshToken
        });

        const newAccessToken = res.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("No new token");
        }

        // ✅ SAVE NEW TOKEN
        localStorage.setItem("accessToken", newAccessToken);

        // ✅ RETRY REQUEST
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.log("🔴 Refresh failed");

        // ❗ ONLY clear storage
        localStorage.clear();

        // ❗ DO NOT redirect here
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default api;