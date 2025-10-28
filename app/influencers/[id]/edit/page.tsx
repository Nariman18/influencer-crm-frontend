"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { influencerApi } from "@/lib/api/services";
import { useDuplicateCheck } from "@/lib/hooks/useDuplicateCheck";
import { DuplicateDetectionDialog } from "@/components/influencers/duplicate-detection-dialog";
import { toast } from "sonner";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  InfluencerStatus,
  DuplicateDialogState,
  InfluencerFormData,
  ApiError,
  DuplicateInfluencer,
  InfluencerCreateData,
} from "@/types";
import { debounce } from "@/lib/utils";

export default function EditInfluencerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const influencerId = params.id as string;

  const [formData, setFormData] = useState<InfluencerFormData>({
    name: "",
    email: "",
    instagramHandle: "",
    followers: "",
    engagementRate: "",
    niche: "",
    country: "",
    status: InfluencerStatus.PING_1,
    notes: "",
    lastContactDate: "",
  });
  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateDialogState>({
    open: false,
    duplicate: null,
    type: "both",
  });
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [checkedValues, setCheckedValues] = useState<{
    email?: string;
    instagramHandle?: string;
  }>({});

  const { data: influencer, isLoading } = useQuery({
    queryKey: ["influencer", influencerId],
    queryFn: async () => {
      const response = await influencerApi.getById(influencerId);
      return response.data;
    },
  });

  const duplicateCheck = useDuplicateCheck();
  const updateMutation = useMutation({
    mutationFn: (data: InfluencerCreateData) =>
      influencerApi.update(influencerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      queryClient.invalidateQueries({ queryKey: ["influencer", influencerId] });
      toast.success("Influencer updated successfully");
      router.push(`/influencers/${influencerId}`);
    },
    onError: (error: ApiError) => {
      // Handle backend duplicate error - FIXED: Use duplicate directly, not details.duplicate
      if (
        error.response?.data?.error?.includes("duplicate") ||
        error.response?.data?.duplicate
      ) {
        const duplicate = error.response.data.duplicate;

        // Use type assertion since we know the structure from the backend
        if (duplicate) {
          handleDuplicateDetection(duplicate as DuplicateInfluencer, "both");
        }
      } else {
        const message =
          error.response?.data?.error || "Failed to update influencer";
        toast.error(message);
      }
    },
  });

  // Debounced duplicate check with optimizations
  const checkForDuplicates = debounce(
    async (email: string, instagramHandle: string) => {
      // OPTIMIZATION 1: Minimum length requirements
      const hasValidEmail = email && email.length >= 5; // At least 5 characters for email
      const hasValidInstagram = instagramHandle && instagramHandle.length >= 3; // At least 3 characters for Instagram

      // OPTIMIZATION 2: Skip if no valid input
      if (!hasValidEmail && !hasValidInstagram) {
        setDuplicateWarning(null);
        setIsCheckingDuplicates(false);
        return;
      }

      // OPTIMIZATION 3: Skip incomplete email patterns
      if (
        (hasValidEmail && checkedValues.email === email) ||
        (hasValidInstagram && checkedValues.instagramHandle === instagramHandle)
      ) {
        return;
      }

      setCheckedValues({
        email: hasValidEmail ? email : undefined,
        instagramHandle: hasValidInstagram ? instagramHandle : undefined,
      });

      setIsCheckingDuplicates(true);
      try {
        const result = await duplicateCheck.mutateAsync({
          email: hasValidEmail ? email : undefined,
          instagramHandle: hasValidInstagram ? instagramHandle : undefined,
        });

        if (result.isDuplicate && result.duplicate) {
          let warning = null;
          let type: "email" | "instagram" | "both" = "both";

          if (
            email &&
            instagramHandle &&
            result.duplicate.email?.toLowerCase() === email.toLowerCase() &&
            result.duplicate.instagramHandle?.toLowerCase() ===
              instagramHandle.toLowerCase()
          ) {
            warning = `Duplicate: email and Instagram handle match existing influencer "${result.duplicate.name}"`;
            type = "both";
          } else if (
            email &&
            result.duplicate.email?.toLowerCase() === email.toLowerCase()
          ) {
            warning = `Duplicate email: matches existing influencer "${result.duplicate.name}"`;
            type = "email";
          } else if (
            instagramHandle &&
            result.duplicate.instagramHandle?.toLowerCase() ===
              instagramHandle.toLowerCase()
          ) {
            warning = `Duplicate Instagram: matches existing influencer "${result.duplicate.name}"`;
            type = "instagram";
          }

          setDuplicateWarning(warning);
          setDuplicateDialog((prev) => ({
            ...prev,
            duplicate: result.duplicate || null,
            type,
          }));
        } else {
          setDuplicateWarning(null);
        }
      } catch (error) {
        console.error("Duplicate check failed:", error);
      } finally {
        setIsCheckingDuplicates(false);
      }
    },
    800
  );

  const handleDuplicateDetection = (
    duplicate: DuplicateInfluencer,
    type: "email" | "instagram" | "both"
  ) => {
    setDuplicateDialog({
      open: true,
      duplicate,
      type,
    });
  };

  const handleContinueWithDuplicate = () => {
    setDuplicateDialog({ open: false, duplicate: null, type: "both" });
    setDuplicateWarning(null);
    submitForm();
  };

  const handleCancelDuplicate = () => {
    setDuplicateDialog({ open: false, duplicate: null, type: "both" });
  };

  const handleChange = (field: keyof InfluencerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Check for duplicates when email or Instagram handle changes
    if (field === "email" || field === "instagramHandle") {
      checkForDuplicates(
        field === "email" ? value : formData.email,
        field === "instagramHandle" ? value : formData.instagramHandle
      );
    }
  };

  const submitForm = () => {
    // Convert form data to API data (string to number conversion)
    const submitData: InfluencerCreateData = {
      name: formData.name,
      email: formData.email || undefined,
      instagramHandle: formData.instagramHandle || undefined,
      followers: formData.followers ? parseInt(formData.followers) : undefined,
      engagementRate: formData.engagementRate
        ? parseFloat(formData.engagementRate)
        : undefined,
      niche: formData.niche || undefined,
      country: formData.country || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
      lastContactDate: formData.lastContactDate
        ? new Date(formData.lastContactDate).toISOString()
        : undefined,
    };

    updateMutation.mutate(submitData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If there's a duplicate warning, show the dialog
    if (duplicateWarning && duplicateDialog.duplicate) {
      setDuplicateDialog((prev) => ({ ...prev, open: true }));
      return;
    }

    submitForm();
  };

  // Initialize form with influencer data
  useEffect(() => {
    if (influencer) {
      setFormData({
        name: influencer.name || "",
        email: influencer.email || "",
        instagramHandle: influencer.instagramHandle || "",
        followers: influencer.followers?.toString() || "",
        engagementRate: influencer.engagementRate?.toString() || "",
        niche: influencer.niche || "",
        country: influencer.country || "",
        status: influencer.status,
        notes: influencer.notes || "",
        lastContactDate: influencer.lastContactDate
          ? new Date(influencer.lastContactDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [influencer]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading influencer...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!influencer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Influencer not found
          </h1>
          <Link href="/influencers">
            <Button className="mt-4">Back to Influencers</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/influencers/${influencerId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Influencer</h1>
              <p className="text-muted-foreground mt-2">
                Update influencer profile
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Influencer Information</CardTitle>
          </CardHeader>
          <CardContent>
            {duplicateWarning && (
              <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium">
                    {duplicateWarning}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    This would create a duplicate influencer in your database.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="email@example.com"
                        className={
                          duplicateWarning?.includes("email")
                            ? "border-amber-300 pr-10"
                            : ""
                        }
                      />
                      {isCheckingDuplicates && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Instagram Handle
                    </label>
                    <div className="relative">
                      <Input
                        value={formData.instagramHandle}
                        onChange={(e) =>
                          handleChange("instagramHandle", e.target.value)
                        }
                        placeholder="username"
                        className={
                          duplicateWarning?.includes("Instagram")
                            ? "border-amber-300 pr-10"
                            : ""
                        }
                      />
                      {isCheckingDuplicates && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleChange("status", value as InfluencerStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={InfluencerStatus.PING_1}>
                          Ping 1
                        </SelectItem>
                        <SelectItem value={InfluencerStatus.PING_2}>
                          Ping 2
                        </SelectItem>
                        <SelectItem value={InfluencerStatus.PING_3}>
                          Ping 3
                        </SelectItem>
                        <SelectItem value={InfluencerStatus.CONTRACT}>
                          Contract
                        </SelectItem>
                        <SelectItem value={InfluencerStatus.REJECTED}>
                          Rejected
                        </SelectItem>
                        <SelectItem value={InfluencerStatus.COMPLETED}>
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Followers</label>
                    <Input
                      type="number"
                      value={formData.followers}
                      onChange={(e) =>
                        handleChange("followers", e.target.value)
                      }
                      placeholder="100000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Engagement Rate (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.engagementRate}
                      onChange={(e) =>
                        handleChange("engagementRate", e.target.value)
                      }
                      placeholder="2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Niche</label>
                    <Input
                      value={formData.niche}
                      onChange={(e) => handleChange("niche", e.target.value)}
                      placeholder="Fashion, Travel, Food..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Country</label>
                    <Input
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      placeholder="Country"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Last Contact Date
                    </label>
                    <Input
                      type="date"
                      value={formData.lastContactDate}
                      onChange={(e) =>
                        handleChange("lastContactDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange("notes", e.target.value)
                  }
                  placeholder="Additional notes about this influencer..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link href={`/influencers/${influencerId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || isCheckingDuplicates}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending
                    ? "Updating..."
                    : "Update Influencer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <DuplicateDetectionDialog
        open={duplicateDialog.open}
        onOpenChange={(open: boolean) =>
          setDuplicateDialog((prev) => ({ ...prev, open }))
        }
        duplicate={duplicateDialog.duplicate}
        onContinue={handleContinueWithDuplicate}
        onCancel={handleCancelDuplicate}
        type={duplicateDialog.type}
      />
    </DashboardLayout>
  );
}
