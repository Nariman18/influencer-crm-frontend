import { useMutation } from "@tanstack/react-query";
import { influencerApi } from "@/lib/api/services";
import {
  ApiDuplicateInfluencer,
  DuplicateCheckResult,
  DuplicateInfluencer,
  InfluencerStatus,
} from "@/types";

interface DuplicateCheckRequest {
  email?: string;
  instagramHandle?: string;
  excludeId?: string;
}

// Helper function to convert string status to InfluencerStatus enum
const convertToDuplicateInfluencer = (
  data: ApiDuplicateInfluencer | undefined
): DuplicateInfluencer | undefined => {
  if (!data) return undefined;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    instagramHandle: data.instagramHandle,
    status: data.status as InfluencerStatus,
  };
};

export const useDuplicateCheck = () => {
  return useMutation({
    mutationFn: async (
      data: DuplicateCheckRequest
    ): Promise<DuplicateCheckResult> => {
      const response = await influencerApi.checkDuplicates(data);

      // Convert the response to match our types
      return {
        isDuplicate: response.data.isDuplicate,
        duplicate: convertToDuplicateInfluencer(response.data.duplicate),
      };
    },
  });
};
