"use client";

import { useState, useEffect, useCallback } from "react"; // <-- added useCallback
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi, emailApi } from "@/lib/api/services";
import { toast } from "sonner";
import { GoogleConnectDialog } from "@/components/auth/google-connect-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, RefreshCw, Mail } from "lucide-react";
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

  // memoize checkEmailConfig so it can safely be used inside useEffect and elsewhere
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

  const googleEmailDisplay = user?.hasGoogleAuth
    ? user?.googleEmail ?? emailConfig?.gmailAddress ?? user?.email
    : user?.email;

  const googleNameDisplay = user?.hasGoogleAuth
    ? user?.googleName ?? emailConfig?.userName ?? user?.name
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

        {/* Google Account Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Google Account Connection
            </CardTitle>
            <CardDescription>
              Connect your Gmail account to send emails to influencers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.hasGoogleAuth ? (
              <div className="space-y-4">
                <Alert
                  variant="default"
                  className="bg-green-50 border-green-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-semibold">Connected to Google</div>
                    <div>
                      Gmail address: {googleEmailDisplay ?? "Connected"}
                    </div>
                    <div>Name: {googleNameDisplay ?? "—"}</div>
                  </AlertDescription>
                </Alert>

                {emailConfig && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Email Configuration:
                      </span>
                      <Badge
                        variant={
                          emailConfig.isValid ? "default" : "destructive"
                        }
                      >
                        {emailConfig.isValid ? "Valid" : "Invalid"}
                      </Badge>
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
                    </div>
                    {emailConfig.message && (
                      <p
                        className={`text-sm ${
                          emailConfig.isValid
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {emailConfig.message}
                      </p>
                    )}
                  </div>
                )}

                {isCheckingConfig && (
                  <p className="text-sm text-blue-600">
                    Testing email configuration...
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setConnectDialogOpen(true)}
                    variant="outline"
                  >
                    Reconnect Google Account
                  </Button>
                  <Button
                    onClick={() => disconnectMutation.mutate()}
                    variant="destructive"
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No Google account connected. Connect your Gmail account to
                    send emails.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => setConnectDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Connect Google Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Name:</span>
              <span className="text-sm">
                {user?.hasGoogleAuth ? googleNameDisplay : user?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">
                {user?.hasGoogleAuth ? googleEmailDisplay : user?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Role:</span>
              <span className="text-sm capitalize">
                {user?.role?.toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Google Account:</span>
              <span className="text-sm">
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
              </span>
            </div>
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
