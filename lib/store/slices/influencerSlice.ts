import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Influencer } from "@/types";
import { InfluencerStatus } from "@/lib/shared-types";

export interface InfluencerFilters {
  status?: InfluencerStatus | "ALL";
  search?: string;
  emailFilter?: "ALL" | "HAS_EMAIL" | "NO_EMAIL";
  country?: string;
  page?: number;
  limit?: number;
}

interface InfluencersState {
  influencers: Influencer[];
  filters: InfluencerFilters;
  isLoading: boolean;
  error: string | null;
  selectedInfluencers: Influencer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: InfluencersState = {
  influencers: [],
  filters: {
    status: "ALL",
    emailFilter: "ALL",
    country: undefined,
    page: 1,
    limit: 50,
  },
  isLoading: false,
  error: null,
  selectedInfluencers: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  },
};

const influencersSlice = createSlice({
  name: "influencers",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setInfluencers: (state, action: PayloadAction<Influencer[]>) => {
      state.influencers = action.payload;
    },

    updateFilters: (
      state,
      action: PayloadAction<Partial<InfluencerFilters>>
    ) => {
      // Always merge, reset page only on filter changes
      const newFilters = { ...state.filters, ...action.payload };

      // Reset page if actual filters changed (not page navigation)
      const isPageChange = action.payload.page !== undefined;
      const isFilterChange =
        state.filters.status !== newFilters.status ||
        state.filters.search !== newFilters.search ||
        state.filters.emailFilter !== newFilters.emailFilter ||
        state.filters.country !== newFilters.country;

      if (isFilterChange && !isPageChange) {
        newFilters.page = 1;
      }

      state.filters = newFilters;

      console.log("🔄 Redux filters:", {
        action: action.payload,
        isPageChange,
        isFilterChange,
        oldPage: state.filters.page,
        newPage: newFilters.page,
      });
    },

    clearFilters: (state) => {
      state.filters = {
        status: "ALL",
        emailFilter: "ALL",
        country: undefined,
        page: 1,
        limit: 50,
      };
    },

    setPagination: (
      state,
      action: PayloadAction<typeof initialState.pagination>
    ) => {
      state.pagination = action.payload;
    },

    setSelectedInfluencers: (state, action: PayloadAction<Influencer[]>) => {
      state.selectedInfluencers = action.payload;
    },

    addSelectedInfluencer: (state, action: PayloadAction<Influencer>) => {
      if (!state.selectedInfluencers.find((i) => i.id === action.payload.id)) {
        state.selectedInfluencers.push(action.payload);
      }
    },

    removeSelectedInfluencer: (state, action: PayloadAction<string>) => {
      state.selectedInfluencers = state.selectedInfluencers.filter(
        (i) => i.id !== action.payload
      );
    },

    clearSelectedInfluencers: (state) => {
      state.selectedInfluencers = [];
    },

    addInfluencer: (state, action: PayloadAction<Influencer>) => {
      state.influencers.unshift(action.payload);
    },

    updateInfluencer: (state, action: PayloadAction<Influencer>) => {
      const index = state.influencers.findIndex(
        (i) => i.id === action.payload.id
      );
      if (index !== -1) {
        state.influencers[index] = action.payload;
      }
    },

    removeInfluencer: (state, action: PayloadAction<string>) => {
      state.influencers = state.influencers.filter(
        (i) => i.id !== action.payload
      );
      state.selectedInfluencers = state.selectedInfluencers.filter(
        (i) => i.id !== action.payload
      );
    },

    removeInfluencers: (state, action: PayloadAction<string[]>) => {
      state.influencers = state.influencers.filter(
        (i) => !action.payload.includes(i.id)
      );
      state.selectedInfluencers = state.selectedInfluencers.filter(
        (i) => !action.payload.includes(i.id)
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
  setInfluencers,
  updateFilters,
  clearFilters,
  setPagination,
  setSelectedInfluencers,
  addSelectedInfluencer,
  removeSelectedInfluencer,
  clearSelectedInfluencers,
  addInfluencer,
  updateInfluencer,
  removeInfluencer,
  removeInfluencers,
  clearError,
} = influencersSlice.actions;

export default influencersSlice.reducer;
