import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import influencersReducer from "./slices/influencerSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    influencers: influencersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
