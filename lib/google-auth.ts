import apiClient from "./api/client"; // Import default export
import { GoogleTokens, ApiError } from "@/types";

export class GoogleAuthService {
  /**
   * Exchange authorization code for tokens using backend endpoint
   */
  static async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      console.log("Exchanging code for tokens via backend...");
      console.log("Code length:", code?.length);

      // Use the regular apiClient for this endpoint (it will handle auth if needed)
      const response = await apiClient.post<GoogleTokens>(
        "/auth/google/exchange-token",
        { code }
      );

      console.log("Tokens received successfully via backend");
      return response.data;
    } catch (error: unknown) {
      console.error("Token exchange error:", error);

      const apiError = error as ApiError;

      // Provide more detailed error information
      if (apiError.response) {
        console.error("Response status:", apiError.response.status);
        console.error("Response data:", apiError.response.data);

        const errorMessage =
          apiError.response.data?.message ||
          apiError.response.data?.error ||
          "Token exchange failed";

        throw new Error(`Google OAuth failed: ${errorMessage}`);
      } else if (apiError.message) {
        console.error("⚡ Request setup error:", apiError.message);
        throw new Error(`Request failed: ${apiError.message}`);
      } else {
        throw new Error("Unknown error occurred during token exchange");
      }
    }
  }
}
