import axios from "axios";

/**
 * Geliştirme: baseURL boş → istekler sayfa ile aynı origin (5173), Vite `/api` → 5050.
 * Doğrudan 127.0.0.1:5050 kullanmak localhost ile farklı origin sayılır; CORS/oturum yüzünden
 * sayfa beyaz kalabilir veya istekler takılabilir.
 * Canlı: VITE_API_URL veya varsayılan http://localhost:5050
 */
const envUrl =
  typeof import.meta.env.VITE_API_URL === "string"
    ? import.meta.env.VITE_API_URL.trim()
    : "";
const baseURL =
  envUrl || (import.meta.env.DEV ? "" : "http://localhost:5050");

/** VITE_API_URL .../api ile biterse istek /api/auth/... → /api/api/auth/... olur; tek /api kalsın. */
const baseEndsWithApi =
  Boolean(envUrl) && /\/api$/i.test(envUrl.replace(/\/+$/, ""));

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  /** Görüntülü kalori analizi vb. uzun sürebilir; 25 sn yetmeyebilir. */
  timeout: 120_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (
      baseEndsWithApi &&
      typeof config.url === "string" &&
      config.url.startsWith("/api/")
    ) {
      config.url = config.url.replace(/^\/api/, "") || "/";
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Access token 15 dakika: süre dolunca 401 döner.
 * Refresh token (httpOnly cookie) ile /api/auth/refresh çağırıp token'ı yenileyip isteği 1 kez tekrarlarız.
 */
let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (!originalRequest || (status !== 401 && status !== 403)) {
      return Promise.reject(error);
    }

    if (originalRequest.__isRetryRequest) {
      return Promise.reject(error);
    }

    const url = String(originalRequest.url || "");
    if (
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/logout")
    ) {
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post("/api/auth/refresh")
          .then((res) => {
            const newToken = res?.data?.token;
            const newUser = res?.data?.user;

            if (typeof newToken === "string" && newToken.trim()) {
              localStorage.setItem("token", newToken);
            }
            if (newUser) {
              localStorage.setItem("user", JSON.stringify(newUser));
            }

            return newToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (!newToken) {
        return Promise.reject(error);
      }

      originalRequest.__isRetryRequest = true;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return apiClient(originalRequest);
    } catch (refreshErr) {
      return Promise.reject(refreshErr);
    }
  }
);

export default apiClient;