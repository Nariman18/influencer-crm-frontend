import axios, {
  InternalAxiosRequestConfig,
  AxiosHeaders,
  AxiosRequestHeaders,
} from "axios";
import { store } from "@/lib/store";
import { logout } from "@/lib/store/slices/authSlice";

/**
 * Get JWT token safely:
 * SSR-safe
 * Prefer Redux state
 * Fallback to localStorage
 */
const getToken = (): string | null => {
  try {
    if (typeof window === "undefined") return null;

    const state = store.getState();
    if (state?.auth?.token) return state.auth.token;

    return localStorage.getItem("token");
  } catch (err) {
    console.warn("client.getToken error:", err);
    return null;
  }
};

const API_ROOT_RAW =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
const API_ROOT = API_ROOT_RAW.replace(/\/$/, ""); // removing trailing slash

const apiClient = axios.create({
  baseURL: API_ROOT,
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (!token) return config;

    // config.headers can be AxiosHeaders or plain object
    const existing = config.headers as
      | AxiosRequestHeaders
      | AxiosHeaders
      | undefined;

    // If already an AxiosHeaders instance, reuse it.
    let headersInstance: AxiosHeaders;
    if (existing instanceof AxiosHeaders) {
      headersInstance = existing;
    } else {
      // Converts plain object to AxiosHeaders
      headersInstance = new AxiosHeaders(
        existing as Record<string, string | number | string[]> | undefined
      );
    }

    // Set Authorization
    headersInstance.set("Authorization", `Bearer ${token}`);

    // Assigns back to config.headers
    config.headers =
      headersInstance as unknown as InternalAxiosRequestConfig["headers"];

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Handle 401 responses:
 * logout user
 * redirect to login
 */
apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        store.dispatch(logout());
      } catch (e) {
        console.warn("Logout dispatch failed:", e);
      }
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
