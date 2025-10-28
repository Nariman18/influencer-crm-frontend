"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/services";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ApiError } from "@/types";

interface GoogleConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function GoogleConnectDialog({
  open,
  onOpenChange,
  onConnected,
}: GoogleConnectDialogProps) {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  const connectMutation = useMutation({
    mutationFn: (data: {
      accessToken: string;
      refreshToken: string;
      email: string;
    }) => authApi.connectGoogle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Google account connected successfully");
      onConnected();
      onOpenChange(false);
    },
    onError: (error: ApiError) => {
      console.error("Google connection failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to connect Google account";
      toast.error(errorMessage);
    },
  });

  const handleGoogleAuth = () => {
    // Clear any previous OAuth state
    sessionStorage.removeItem("googleOAuthInProgress");
    sessionStorage.removeItem("pendingGoogleAuth");

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in first to connect your Google account");
      router.push("/auth/login");
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      toast.error("Google Client ID not configured");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    // Removing any double slashes that might occur
    const cleanRedirectUri = redirectUri.replace(/\/\/+/g, "/");
    const scope = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" ");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(cleanRedirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    // Store that we're in the middle of Google OAuth
    sessionStorage.setItem("googleOAuthInProgress", "true");

    console.log("🔗 Redirecting to Google OAuth with scopes:", scope);
    window.location.href = authUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Google Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Gmail account to send emails to influencers directly
            from the CRM.
          </p>
          <Button
            onClick={handleGoogleAuth}
            className="w-full"
            variant="outline"
            disabled={isConnecting || connectMutation.isPending}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isConnecting || connectMutation.isPending
              ? "Connecting..."
              : "Connect with Google"}
          </Button>

          {(isConnecting || connectMutation.isPending) && (
            <p className="text-sm text-blue-600 text-center">
              Connecting your Google account...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
