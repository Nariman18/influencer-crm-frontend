import { useDispatch, useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RootState } from "@/lib/store";
import { contractApi } from "@/lib/api/services";
import {
  setLoading,
  setError,
  setContracts,
  setPagination,
  updateFilters,
  clearSelectedContracts,
  removeContracts,
  clearFilters,
} from "@/lib/store/slices/contractSlice";
import { useCallback } from "react";
import { ContractStatus } from "../shared-types";

interface ApiParams {
  page?: number;
  limit?: number;
  status?: ContractStatus;
  search?: string;
  campaignId?: string;
}

export const useContracts = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { filters, selectedContracts } = useSelector(
    (state: RootState) => state.contracts
  );

  // Fetch contracts with current filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["contracts", filters],
    queryFn: async () => {
      dispatch(setLoading(true));

      try {
        const params: ApiParams = {
          page: filters.page,
          limit: filters.limit,
        };

        if (filters.status !== "ALL")
          params.status = filters.status as ContractStatus;
        if (filters.search) params.search = filters.search;

        const response = await contractApi.getAll(params);

        dispatch(setContracts(response.data.data));

        const apiPagination = response.data.pagination;
        // FIX: Properly map API pagination to Redux state
        dispatch(
          setPagination({
            currentPage: apiPagination.page,
            totalPages: apiPagination.totalPages,
            totalCount: apiPagination.total, // Map 'total' to 'totalCount'
            hasNext: apiPagination.page < apiPagination.totalPages,
            hasPrev: apiPagination.page > 1,
          })
        );

        return response.data;
      } catch (err) {
        console.error("❌ Error fetching contracts:", err);
        dispatch(setError("Failed to fetch contracts"));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
  });

  // Update filters
  const updateContractFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      dispatch(updateFilters(newFilters));
      dispatch(clearSelectedContracts());
    },
    [dispatch]
  );

  // Clear all filters
  const clearContractFilters = useCallback(() => {
    dispatch(clearFilters());
    dispatch(clearSelectedContracts());
  }, [dispatch]);

  // Delete contract mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contractApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  // Bulk delete contracts mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => contractApi.bulkDelete(ids),
    onSuccess: (response, ids) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      dispatch(removeContracts(ids));
      dispatch(clearSelectedContracts());
    },
  });

  return {
    contracts: data?.data || [],
    // FIX: Return the pagination from Redux state, not from API response
    pagination: useSelector((state: RootState) => state.contracts.pagination),
    filters,
    selectedContracts,
    isLoading,
    error,
    updateFilters: updateContractFilters,
    clearFilters: clearContractFilters,
    deleteContract: deleteMutation.mutate,
    bulkDeleteContracts: bulkDeleteMutation.mutate,
  };
};
