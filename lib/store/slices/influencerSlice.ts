import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Influencer, InfluencerStatus } from "@/types";

export interface InfluencerFilters {
  status?: InfluencerStatus | "ALL";
  search?: string;
  emailFilter?: "ALL" | "HAS_EMAIL" | "NO_EMAIL";
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
    page: 1,
    limit: 20,
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
      const oldFilters = { ...state.filters };
      state.filters = { ...state.filters, ...action.payload };

      // Only reset to page 1 if actual filters (not page) changed
      const filterKeys = ["status", "search", "emailFilter"] as const;
      const filtersChanged = filterKeys.some(
        (key) => oldFilters[key] !== state.filters[key]
      );

      if (filtersChanged && !action.payload.page) {
        // Reset to page 1 only when search/status/email filters change
        state.filters.page = 1;
        state.pagination.currentPage = 1;
      }
    },

    clearFilters: (state) => {
      state.filters = {
        status: "ALL",
        emailFilter: "ALL",
        page: 1,
        limit: 20,
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
