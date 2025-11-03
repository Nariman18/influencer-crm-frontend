import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { RootState } from "@/lib/store";
import { authApi } from "@/lib/api/services";
import { setCredentials, logout } from "@/lib/store/slices/authSlice";
import { useEffect } from "react";

export const useCurrentUser = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  // Use Tanstack Query to fetch and sync user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await authApi.getProfile();
        return response.data;
      } catch (error) {
        // If profile fetch fails, logout user
        dispatch(logout());
        throw error;
      }
    },
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Sync the user profile with Redux when it changes
  useEffect(() => {
    if (userProfile && user?.id !== userProfile.id) {
      // Update Redux store with fresh user data
      dispatch(
        setCredentials({
          user: userProfile,
          token: token!, // token exists because we're authenticated
        })
      );
    }
  }, [userProfile, user, token, dispatch]);

  return {
    user: userProfile || user,
    isLoading: isLoading || !isInitialized,
    isAuthenticated,
  };
};
