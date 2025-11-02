import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Create a public client for endpoints that don't require authentication
export const publicApiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Create an authenticated client for endpoints that require authentication
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token only for authenticated client
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (for authenticated client only)
// lib/api/client.ts - Update the interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Safely get token from localStorage (only in browser)
    let token = null;
    if (typeof window !== "undefined") {
      // Try the specific key 'token' first since we know it exists
      token = localStorage.getItem("token");

      if (token) {
        console.log("✅ Found token in localStorage.token");
      } else {
        // Fallback to other keys
        token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("authToken") ||
          null;
        if (token) {
          console.log("✅ Found token in fallback location");
        } else {
          console.log("❌ No token found in any location");
        }
      }

      console.log("🔐 Token details:", {
        length: token?.length,
        first10: token?.substring(0, 10) + "...",
        last10: token ? "..." + token.substring(token.length - 10) : "none",
      });
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Token added to Authorization header");
    } else {
      console.log("❌ No token available for request");
    }

    console.log("🔐 Final request configuration:", {
      url: config.url,
      method: config.method,
      hasAuthHeader: !!config.headers.Authorization,
      params: config.params,
    });

    return config;
  },
  (error) => {
    console.log("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

export default apiClient;
