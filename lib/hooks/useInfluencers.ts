import { useDispatch, useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RootState } from "@/lib/store";
import { influencerApi } from "@/lib/api/services";
import {
  setLoading,
  setError,
  setInfluencers,
  setPagination,
  updateFilters,
  clearSelectedInfluencers,
  clearFilters,
  removeInfluencer,
} from "@/lib/store/slices/influencerSlice";
import { useCallback } from "react";
import { Influencer, InfluencerStatus } from "@/types";
import { useCurrentUser } from "./useCurrentUser";

interface ApiParams {
  page?: number;
  limit?: number;
  status?: InfluencerStatus;
  search?: string;
  emailFilter?: string;
}

export const useInfluencers = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { filters, selectedInfluencers } = useSelector(
    (state: RootState) => state.influencers
  );

  // Get current user to verify we're authenticated
  const { user: currentUser, isAuthenticated } = useCurrentUser();

  // Create influencer mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Influencer>) => {
      console.log(
        "👤 Creating influencer with current user:",
        currentUser?.name
      );
      return influencerApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Influencer> }) =>
      influencerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      queryClient.invalidateQueries({ queryKey: ["influencer"] }); // For individual influencer pages
    },
  });

  // Fetch influencers with current filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["influencers", filters],
    queryFn: async () => {
      // Only fetch if authenticated
      if (!isAuthenticated || !currentUser) {
        console.log("🔄 Skipping influencers fetch - not authenticated");
        dispatch(setInfluencers([]));
        dispatch(
          setPagination({
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasNext: false,
            hasPrev: false,
          })
        );
        return { data: [], pagination: { page: 1, totalPages: 0, total: 0 } };
      }

      dispatch(setLoading(true));

      try {
        const params: ApiParams = {
          page: filters.page,
          limit: filters.limit,
        };

        if (filters.search) params.search = filters.search;
        if (filters.status !== "ALL")
          params.status = filters.status as InfluencerStatus;

        // Email filter - use the new parameter name
        if (filters.emailFilter === "HAS_EMAIL") {
          params.emailFilter = "has-email";
        } else if (filters.emailFilter === "NO_EMAIL") {
          params.emailFilter = "no-email";
        }

        console.log("🔄 Fetching influencers with params:", params);
        console.log("👤 Current user:", currentUser.name, currentUser.email);

        const response = await influencerApi.getAll(params);

        // Log manager information for debugging
        response.data.data.forEach((influencer: Influencer) => {
          console.log(
            `📊 Influencer: ${influencer.name}, Manager:`,
            influencer.manager?.name || "None"
          );
        });

        // Use the API response format directly
        dispatch(setInfluencers(response.data.data));

        // Map API pagination response to Redux format
        const apiPagination = response.data.pagination;
        dispatch(
          setPagination({
            currentPage: apiPagination.page,
            totalPages: apiPagination.totalPages,
            totalCount: apiPagination.total,
            hasNext: apiPagination.page < apiPagination.totalPages,
            hasPrev: apiPagination.page > 1,
          })
        );

        return response.data;
      } catch (err) {
        console.error("❌ Error fetching influencers:", err);
        dispatch(setError("Failed to fetch influencers"));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Update filters
  const updateInfluencerFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      dispatch(updateFilters(newFilters));
      dispatch(clearSelectedInfluencers());
    },
    [dispatch]
  );

  // Clear all filters
  const clearInfluencerFilters = useCallback(() => {
    dispatch(clearFilters());
    dispatch(clearSelectedInfluencers());
  }, [dispatch]);

  // Delete influencer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => influencerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => influencerApi.bulkDelete(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      // Remove deleted influencers from state
      ids.forEach((id) => {
        dispatch(removeInfluencer(id));
      });
      dispatch(clearSelectedInfluencers());
    },
  });

  return {
    influencers: data?.data || [],
    pagination: useSelector((state: RootState) => state.influencers.pagination),
    filters,
    selectedInfluencers,
    isLoading,
    error,

    currentTotalCount: data?.pagination?.total || 0,
    updateFilters: updateInfluencerFilters,
    clearFilters: clearInfluencerFilters,
    deleteInfluencer: deleteMutation.mutate,
    createInfluencer: createMutation.mutate,
    updateInfluencer: updateMutation.mutate,
    bulkDeleteInfluencers: bulkDeleteMutation.mutate,
    currentUser,
  };
};
