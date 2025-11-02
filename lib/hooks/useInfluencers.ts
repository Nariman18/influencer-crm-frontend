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
} from "@/lib/store/slices/influencerSlice";
import { useCallback } from "react";
import { InfluencerStatus } from "@/types";

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

  // Fetch influencers with current filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["influencers", filters],
    queryFn: async () => {
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

        const response = await influencerApi.getAll(params);

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
        dispatch(setError("Failed to fetch influencers"));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
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

  return {
    influencers: data?.data || [],
    pagination: data?.pagination,
    filters,
    selectedInfluencers,
    isLoading,
    error,
    updateFilters: updateInfluencerFilters,
    clearFilters: clearInfluencerFilters,
    deleteInfluencer: deleteMutation.mutate,
  };
};
