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
    }) => authApi.connectGoogle(data),
    onSuccess: (data) => {
      toast.success("Google account connected successfully");
      console.log("Google connected:", data);

      // Clear any stored OAuth state
      sessionStorage.removeItem("googleOAuthInProgress");
      sessionStorage.removeItem("pendingGoogleAuth");

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

      // Handle errors first
      if (error) {
        console.error("OAuth error:", error);
        toast.error(`Google authentication failed: ${error}`);
        router.push("/settings");
        return;
      }

      // Process the code
      if (code) {
        setIsProcessing(true);
        setHasProcessed(true);
        console.log(" Processing OAuth code...");

        try {
          // Check if user is authenticated
          const token = localStorage.getItem("token");
          if (!token) {
            // Store the code in session storage and redirect to login
            sessionStorage.setItem("pendingGoogleAuth", code);
            toast.info("Please log in to connect your Google account");
            router.push("/auth/login");
            return;
          }

          // Exchange code for tokens
          console.log(" Exchanging code for tokens...");
          const tokens = await GoogleAuthService.exchangeCodeForTokens(code);
          console.log(" Tokens received:", tokens);

          // Send tokens to backend for storage
          await connectMutation.mutateAsync({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            email: tokens.email,
          });
        } catch (error) {
          console.error(" OAuth processing failed:", error);
          toast.error("Failed to process Google authentication");
          router.push("/settings");
        } finally {
          setIsProcessing(false);
        }
      } else {
        console.log(" No OAuth code received");
        toast.error("No authorization code received");
        router.push("/settings");
      }
    };

    processOAuthCallback();
  }, [code, error, router, isProcessing, hasProcessed, connectMutation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {isProcessing
            ? "Processing Google authentication..."
            : "Connecting Google account..."}
        </p>
      </div>
    </div>
  );
}
