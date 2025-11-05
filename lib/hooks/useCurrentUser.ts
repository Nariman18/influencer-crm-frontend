import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { RootState } from "@/lib/store";
import { authApi } from "@/lib/api/services";
import { setCredentials, logout } from "@/lib/store/slices/authSlice";
import { useEffect, useMemo } from "react";
import { ApiError } from "@/types";

export const useCurrentUser = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  const {
    data: userProfile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["currentUser", token],
    queryFn: async () => {
      if (!token) {
        throw new Error("No token available");
      }

      try {
        const response = await authApi.getProfile();
        return response.data;
      } catch (error: unknown) {
        // Only logout on 401 errors
        const apiError = error as ApiError;
        if (apiError?.response?.status === 401) {
          dispatch(logout());
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!token && isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401 errors
      const apiError = error as ApiError;
      if (apiError?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Sync user profile with Redux
  useEffect(() => {
    if (userProfile && user?.id !== userProfile.id) {
      dispatch(
        setCredentials({
          user: userProfile,
          token: token!,
        })
      );
    }
  }, [userProfile, user, token, dispatch]);

  return useMemo(
    () => ({
      user: userProfile || user,
      isLoading: isLoading || !isInitialized,
      isAuthenticated: isAuthenticated && !!userProfile,
      error,
      refetch,
    }),
    [
      userProfile,
      user,
      isLoading,
      isInitialized,
      isAuthenticated,
      error,
      refetch,
    ]
  );
};
