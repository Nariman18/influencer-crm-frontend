// frontend/google-connect-dialog.tsx
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

function base64EncodeUnicode(str: string) {
  // Use TextEncoder to get UTF-8 bytes, then btoa over the binary string.
  // This avoids the deprecated `unescape(encodeURIComponent(...))` pattern.
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str); // Uint8Array of UTF-8 bytes

  // Convert bytes -> binary string (each byte -> a char with the same code point)
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
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
      state?: string;
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
    sessionStorage.removeItem("pendingGoogleState");

    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      toast.error("Please log in first to connect your Google account");
      router.push("/auth/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      toast.error("Failed to read user session. Please re-login.");
      router.push("/auth/login");
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      toast.error("Google Client ID not configured");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    // Gmail scopes
    const scope = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" ");

    // Build a minimal state that ties the flow to the current user
    const stateObj = {
      uid: user.id || user._id || user?.id,
      // nonce for better entropy
      nonce:
        typeof crypto !== "undefined" && (crypto as Crypto).randomUUID
          ? (crypto as Crypto).randomUUID()
          : String(Date.now()),
    };

    const stateEncoded = base64EncodeUnicode(JSON.stringify(stateObj));

    // Save pending state locally so callback can verify it matches what was sent
    sessionStorage.setItem("pendingGoogleState", stateEncoded);
    sessionStorage.setItem("googleOAuthInProgress", "true");

    // Add login_hint to pre-select user's email in account chooser (reduces cross-account confusion)
    const loginHint = encodeURIComponent(user.email || user.googleEmail || "");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${encodeURIComponent(stateEncoded)}` +
      (loginHint ? `&login_hint=${loginHint}` : "");

    console.log("🔗 Redirecting to Google OAuth with state...", stateObj);
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
            Connect your Gmail account to track email replies and maintain your
            sent folder automatically.
          </p>
          <Button
            onClick={handleGoogleAuth}
            className="w-full"
            variant="outline"
            disabled={isConnecting || connectMutation.isPending}
          >
            {/* Google icon SVG */}
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
