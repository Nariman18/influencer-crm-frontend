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
import { Influencer, PaginatedResponse } from "@/types";
import { useCurrentUser } from "./useCurrentUser";
import { InfluencerStatus } from "../shared-types";

interface ApiParams {
  page?: number;
  limit?: number;
  status?: InfluencerStatus;
  search?: string;
  emailFilter?: string;
  country?: string;
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
      queryClient.invalidateQueries({ queryKey: ["influencer"] });
    },
  });

  // Use API data directly without complex Redux sync**
  const { data, isLoading, error } = useQuery({
    queryKey: ["influencers", filters],
    queryFn: async () => {
      if (!isAuthenticated || !currentUser) {
        return { data: [], pagination: { page: 1, totalPages: 0, total: 0 } };
      }

      dispatch(setLoading(true));

      try {
        const params: ApiParams = {
          page: filters.page || 1,
          limit: filters.limit || 50,
        };

        if (filters.search) params.search = filters.search;
        if (filters.status !== "ALL")
          params.status = filters.status as InfluencerStatus;
        if (filters.country) params.country = filters.country;

        // Email filter
        if (filters.emailFilter === "HAS_EMAIL") {
          params.emailFilter = "has-email";
        } else if (filters.emailFilter === "NO_EMAIL") {
          params.emailFilter = "no-email";
        }

        console.log("🔄 Fetching influencers with params:", params);

        const response = await influencerApi.getAll(params);
        const responseData = response.data;

        // **OPTIONAL: Update Redux for other components that need it**
        dispatch(setInfluencers(responseData.data));

        const apiPagination = responseData.pagination;
        dispatch(
          setPagination({
            currentPage: apiPagination.page,
            totalPages: apiPagination.totalPages,
            totalCount: apiPagination.total,
            hasNext: apiPagination.page < apiPagination.totalPages,
            hasPrev: apiPagination.page > 1,
          })
        );

        return responseData;
      } catch (err) {
        console.error("❌ Error fetching influencers:", err);
        dispatch(setError("Failed to fetch influencers"));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  // **SIMPLIFIED: Direct filter updates**
  const updateInfluencerFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      console.log("🔄 Updating filters:", newFilters);

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
      ids.forEach((id) => {
        dispatch(removeInfluencer(id));
      });
      dispatch(clearSelectedInfluencers());
    },
  });

  const apiData = data as PaginatedResponse<Influencer> | undefined;

  return {
    // Use API data directly for real-time updates**
    influencers: apiData?.data || [],
    pagination: apiData?.pagination || {
      page: 1,
      totalPages: 1,
      total: 0,
      limit: 50,
    },
    filters,
    selectedInfluencers,
    isLoading,
    error,
    currentTotalCount: apiData?.pagination?.total || 0,
    updateFilters: updateInfluencerFilters,
    clearFilters: clearInfluencerFilters,
    deleteInfluencer: deleteMutation.mutate,
    createInfluencer: createMutation.mutate,
    updateInfluencer: updateMutation.mutate,
    bulkDeleteInfluencers: bulkDeleteMutation.mutate,
    currentUser,
  };
};
