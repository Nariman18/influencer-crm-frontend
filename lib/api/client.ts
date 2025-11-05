import axios from "axios";
import { store } from "@/lib/store";
import { logout } from "@/lib/store/slices/authSlice";

// Safe token retrieval
const getToken = (): string | null => {
  try {
    if (typeof window === "undefined") return null;

    // Try Redux store first
    const state = store.getState();
    if (state.auth.token) {
      return state.auth.token;
    }

    // Fallback to localStorage
    return localStorage.getItem("token");
  } catch (error) {
    console.warn("Error getting token:", error);
    return null;
  }
};

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://influencer-crm-backend.onrender.com/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor with safe token handling
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token available for request to:", config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with proper error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Authentication failed, logging out...");
      store.dispatch(logout());

      // Redirect to login if we're in browser
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
