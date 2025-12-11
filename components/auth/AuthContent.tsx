// AuthContent.tsx (replace your existing file with this)
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/services";
import { GoogleAuthService } from "@/lib/google-auth";
import { toast } from "sonner";
import { ApiError } from "@/types";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  const connectMutation = useMutation({
    mutationFn: (data: {
      accessToken: string;
      refreshToken: string;
      email: string;
      state?: string;
    }) => authApi.connectGoogle(data),
    onSuccess: (data) => {
      toast.success("Google account connected successfully");
      console.log("Google connected:", data);

      // Clear any stored OAuth state
      sessionStorage.removeItem("googleOAuthInProgress");
      sessionStorage.removeItem("pendingGoogleAuth");
      sessionStorage.removeItem("pendingGoogleState");

      router.push("/settings");
    },
    onError: (error: ApiError) => {
      console.error("Google connection failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to connect Google account";

      if (error.response?.status === 401) {
        toast.error("Please log in first, then connect your Google account");
        router.push("/auth/login");
      } else {
        toast.error(errorMessage);
        router.push("/settings");
      }
    },
  });

  useEffect(() => {
    const processOAuthCallback = async () => {
      // Prevent double processing
      if (isProcessing || hasProcessed) {
        console.log("Already processing or processed, skipping...");
        return;
      }

      console.log("Starting OAuth callback processing...");

      // Handle errors first
      if (error) {
        console.error("OAuth error:", error);
        toast.error(`Google authentication failed: ${error}`);
        sessionStorage.removeItem("googleOAuthInProgress");
        router.push("/settings");
        return;
      }

      // Process the code
      if (code) {
        setIsProcessing(true);
        setHasProcessed(true);

        console.log("Processing OAuth code...");
        console.log("Code:", code.substring(0, 20) + "...");

        try {
          // Check if user has a valid token
          const token = localStorage.getItem("token");
          console.log("Token check:", token ? "Present" : "Missing");

          if (!token) {
            console.log("No token found - storing code for later");
            // Store the code and redirect to login
            sessionStorage.setItem("pendingGoogleAuth", code);
            sessionStorage.setItem("pendingRedirect", "/settings");
            toast.info("Please log in to connect your Google account");
            router.push("/auth/login?returnTo=/auth/callback");
            return;
          }

          // Verify the token is valid by making a test API call
          try {
            console.log("Verifying user authentication...");
            // This will throw if token is invalid
            await authApi.getProfile();
            console.log("User is authenticated");
          } catch (authError) {
            console.error("Token invalid:", authError);
            // Token is invalid, store code and redirect to login
            sessionStorage.setItem("pendingGoogleAuth", code);
            sessionStorage.setItem("pendingRedirect", "/settings");
            localStorage.removeItem("token"); // Clear invalid token
            toast.info("Your session expired. Please log in again.");
            router.push("/auth/login?returnTo=/auth/callback");
            return;
          }

          // VERIFY state: must match the state we stored when initiating OAuth
          const stateFromUrl = new URLSearchParams(window.location.search).get(
            "state"
          );
          const pendingState = sessionStorage.getItem("pendingGoogleState");

          if (!stateFromUrl || !pendingState || stateFromUrl !== pendingState) {
            console.warn("OAuth state mismatch or missing", {
              stateFromUrl,
              pendingState,
            });
            toast.error("OAuth state mismatch. Please try connecting again.");
            // Clean up and redirect
            sessionStorage.removeItem("googleOAuthInProgress");
            sessionStorage.removeItem("pendingGoogleAuth");
            sessionStorage.removeItem("pendingGoogleState");
            router.push("/settings");
            return;
          }

          // Exchange code for tokens (server side)
          console.log("Exchanging code for tokens...");
          const tokens = await GoogleAuthService.exchangeCodeForTokens(code);
          console.log("Tokens received:", {
            email: tokens.email,
            hasAccessToken: !!tokens.accessToken,
            hasRefreshToken: !!tokens.refreshToken,
          });

          // Send tokens + state to backend for storage (connect endpoint)
          console.log(
            "Connecting Google account to user profile (including state)..."
          );

          console.log("[DEBUG] connecting google with payload:", {
            access: tokens.accessToken ? "<accessToken...>" : null,
            refresh: tokens.refreshToken ? "<refreshToken...>" : null,
            email: tokens.email,
            state: stateFromUrl,
            pendingState: pendingState,
          });

          await connectMutation.mutateAsync({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            email: tokens.email,
            state: stateFromUrl,
          });

          // success flow handled in onSuccess
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(
            `Failed to process Google authentication: ${errorMessage}`
          );

          // Clear OAuth state on error
          sessionStorage.removeItem("googleOAuthInProgress");
          sessionStorage.removeItem("pendingGoogleAuth");
          sessionStorage.removeItem("pendingGoogleState");

          router.push("/settings");
        } finally {
          setIsProcessing(false);
        }
      } else {
        toast.error("No authorization code received from Google");
        sessionStorage.removeItem("googleOAuthInProgress");
        router.push("/settings");
      }
    };

    processOAuthCallback();
  }, [code, error, router, isProcessing, hasProcessed, connectMutation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">
          Connecting Google Account
        </h2>
        <p className="text-gray-600">
          {isProcessing ? "Processing authentication..." : "Please wait..."}
        </p>
        {code && (
          <p className="text-sm text-gray-500 mt-2">
            Authorization code received
          </p>
        )}
      </div>
    </div>
  );
}
