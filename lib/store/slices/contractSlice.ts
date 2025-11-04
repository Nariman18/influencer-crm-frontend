import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Contract, ContractStatus } from "@/types";

export interface ContractFilters {
  status?: ContractStatus | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}

interface ContractsState {
  contracts: Contract[];
  filters: ContractFilters;
  isLoading: boolean;
  error: string | null;
  selectedContracts: Contract[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: ContractsState = {
  contracts: [],
  filters: {
    status: "ALL",
    page: 1,
    limit: 30,
  },
  isLoading: false,
  error: null,
  selectedContracts: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  },
};

const contractsSlice = createSlice({
  name: "contracts",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setContracts: (state, action: PayloadAction<Contract[]>) => {
      state.contracts = action.payload;
    },

    updateFilters: (state, action: PayloadAction<Partial<ContractFilters>>) => {
      const oldFilters = { ...state.filters };
      state.filters = { ...state.filters, ...action.payload };

      // Only reset to page 1 if actual filters (not page) changed
      const filterKeys = ["status", "search"] as const;
      const filtersChanged = filterKeys.some(
        (key) => oldFilters[key] !== state.filters[key]
      );

      if (filtersChanged && !action.payload.page) {
        state.filters.page = 1;
        state.pagination.currentPage = 1;
      }
    },

    clearFilters: (state) => {
      state.filters = {
        status: "ALL",
        page: 1,
        limit: 30,
      };
    },

    setPagination: (
      state,
      action: PayloadAction<typeof initialState.pagination>
    ) => {
      state.pagination = action.payload;
    },

    setSelectedContracts: (state, action: PayloadAction<Contract[]>) => {
      state.selectedContracts = action.payload;
    },

    addSelectedContract: (state, action: PayloadAction<Contract>) => {
      if (!state.selectedContracts.find((c) => c.id === action.payload.id)) {
        state.selectedContracts.push(action.payload);
      }
    },

    removeSelectedContract: (state, action: PayloadAction<string>) => {
      state.selectedContracts = state.selectedContracts.filter(
        (c) => c.id !== action.payload
      );
    },

    clearSelectedContracts: (state) => {
      state.selectedContracts = [];
    },

    removeContract: (state, action: PayloadAction<string>) => {
      state.contracts = state.contracts.filter((c) => c.id !== action.payload);
      state.selectedContracts = state.selectedContracts.filter(
        (c) => c.id !== action.payload
      );
    },

    removeContracts: (state, action: PayloadAction<string[]>) => {
      state.contracts = state.contracts.filter(
        (c) => !action.payload.includes(c.id)
      );
      state.selectedContracts = state.selectedContracts.filter(
        (c) => !action.payload.includes(c.id)
      );
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setContracts,
  updateFilters,
  clearFilters,
  setPagination,
  setSelectedContracts,
  addSelectedContract,
  removeSelectedContract,
  clearSelectedContracts,
  removeContract,
  removeContracts,
  clearError,
} = contractsSlice.actions;

export default contractsSlice.reducer;
