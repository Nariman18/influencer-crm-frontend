"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi, emailApi } from "@/lib/api/services";
import { toast } from "sonner";
import { GoogleConnectDialog } from "@/components/auth/google-connect-dialog";
import { RefreshCw } from "lucide-react";
import { ApiError, EmailConfig } from "@/types";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response.data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => authApi.disconnectGoogle(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setEmailConfig(null); // Clear email config when disconnected
      toast.success("Google account disconnected");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Failed to disconnect");
    },
  });

  // memoized email config check
  const checkEmailConfig = useCallback(async () => {
    if (!user?.hasGoogleAuth) {
      setEmailConfig(null);
      return;
    }

    setIsCheckingConfig(true);
    try {
      const response = await emailApi.validateConfig();
      setEmailConfig(response.data);
    } catch (error: unknown) {
      console.error("Failed to check email config:", error);
      const apiError = error as ApiError;
      setEmailConfig({
        isValid: false,
        message:
          apiError.response?.data?.message ||
          "Failed to validate email configuration",
        hasTokens: false,
      });
    } finally {
      setIsCheckingConfig(false);
    }
  }, [user?.hasGoogleAuth]);

  // Initialize email config whenever google auth changes
  useEffect(() => {
    const initializeEmailConfig = async () => {
      if (user?.hasGoogleAuth) {
        await checkEmailConfig();
      } else {
        setEmailConfig(null);
      }
    };

    initializeEmailConfig();
  }, [checkEmailConfig, user?.hasGoogleAuth]);

  const handleGoogleConnected = () => {
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    // Check config after a short delay to ensure tokens are stored
    setTimeout(() => {
      checkEmailConfig();
    }, 1000);
  };

  // Prefer Google values when connected, otherwise fall back to app user values
  const googleEmailDisplay = user?.hasGoogleAuth
    ? user?.googleEmail ?? emailConfig?.gmailAddress ?? user?.email
    : user?.email;

  const googleNameDisplay = user?.hasGoogleAuth
    ? user.googleName ?? emailConfig?.userName ?? user?.name
    : user?.name;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and email configuration
          </p>
        </div>

        {/* Account Information (includes Google status + actions) */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Name:</span>
              <span className="text-sm">{googleNameDisplay}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{googleEmailDisplay}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Role:</span>
              <span className="text-sm capitalize">
                {user?.role?.toLowerCase()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Google Account:</span>
                {user?.hasGoogleAuth ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not Connected</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Test button: available only when google is connected */}
                {user?.hasGoogleAuth && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkEmailConfig}
                    disabled={isCheckingConfig}
                    className="h-8"
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-1 ${
                        isCheckingConfig ? "animate-spin" : ""
                      }`}
                    />
                    {isCheckingConfig ? "Testing..." : "Test"}
                  </Button>
                )}

                {/* Connect / Reconnect */}
                <Button
                  onClick={() => setConnectDialogOpen(true)}
                  variant={user?.hasGoogleAuth ? "outline" : "default"}
                  size="sm"
                >
                  {user?.hasGoogleAuth ? "Reconnect" : "Connect"}
                </Button>

                {/* Disconnect (only when connected) */}
                {user?.hasGoogleAuth && (
                  <Button
                    onClick={() => disconnectMutation.mutate()}
                    variant="destructive"
                    size="sm"
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </Button>
                )}
              </div>
            </div>

            {/* Optional: show email config message if present */}
            {emailConfig?.message && (
              <p
                className={`text-sm ${
                  emailConfig.isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {emailConfig.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <GoogleConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onConnected={handleGoogleConnected}
      />
    </DashboardLayout>
  );
}
