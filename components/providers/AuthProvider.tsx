"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initialize } from "@/lib/store/slices/authSlice";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize auth state from storage
    dispatch(initialize());
  }, [dispatch]);

  return <>{children}</>;
}
