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

    // prevent infinite loop
    if (originalRequest._retry) {
      return Promise.reject(err);
    }

    // TOKEN EXPIRED
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

        // save new token
        localStorage.setItem("accessToken", newAccessToken);

        // retry request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.log("🔴 Refresh failed");

        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;