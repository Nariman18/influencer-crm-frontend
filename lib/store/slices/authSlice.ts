import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

// Safe storage utility with error handling
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get ${key} from storage:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set ${key} in storage:`, error);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === "undefined") return;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from storage:`, error);
    }
  },
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    initialize: (state) => {
      try {
        const token = safeStorage.getItem("token");
        const userStr = safeStorage.getItem("user");

        if (token && userStr) {
          state.token = token;
          state.user = JSON.parse(userStr);
          state.isAuthenticated = true;
        }
      } catch (error) {
        console.error("Error initializing auth state:", error);
        // Clear corrupted data
        safeStorage.removeItem("token");
        safeStorage.removeItem("user");
      }
      state.isInitialized = true;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      safeStorage.setItem("token", token);
      safeStorage.setItem("user", JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      safeStorage.removeItem("token");
      safeStorage.removeItem("user");
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        safeStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
});

export const { initialize, setCredentials, logout, updateUser } =
  authSlice.actions;
export default authSlice.reducer;
