import { useQuery } from "@tanstack/react-query";
import { influencerApi } from "@/lib/api/services";

export const useInfluencersCache = () => {
  return useQuery({
    queryKey: ["influencers-cache"],
    queryFn: async () => {
      const response = await influencerApi.getAll({ limit: 500 }); // Adjusting based on my data size
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
