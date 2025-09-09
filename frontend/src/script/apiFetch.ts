import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL ?? "http://localhost:5000",
});

// Request interceptor — всегда добавляем access_token
api.interceptors.request.use(config => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — ловим 401
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // если 401 и мы ещё не пробовали обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // запрос на refresh
        const res = await axios.post(
          (import.meta.env.VITE_BACKEND_API_URL ?? "http://localhost:5000") + "/auth/refresh",
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` }
          }
        );

        const newAccessToken = res.data.access_token;

        // сохраняем новый access_token
        localStorage.setItem("access_token", newAccessToken);

        // обновляем заголовки и повторяем запрос
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (err) {
        // refresh тоже протух → отправляем на login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
