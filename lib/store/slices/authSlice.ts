// lib/store/slices/authSlice.ts
import { User } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // Add this flag
}

// Don't access localStorage in initial state - let it be handled on client side only
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false, // Start as false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isInitialized = true;

      // Save to localStorage (browser only)
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;

      // Clear localStorage (browser only)
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
    loadFromStorage: (state) => {
      if (typeof window !== "undefined") {
        try {
          const token = localStorage.getItem("token");
          const userStr = localStorage.getItem("user");

          if (token && userStr) {
            state.token = token;
            state.user = JSON.parse(userStr);
            state.isAuthenticated = true;
          }
        } catch (error) {
          console.error("Error loading auth from storage:", error);
          // Clear corrupted data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      state.isInitialized = true;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, logout, loadFromStorage, setInitialized } =
  authSlice.actions;
export default authSlice.reducer;
