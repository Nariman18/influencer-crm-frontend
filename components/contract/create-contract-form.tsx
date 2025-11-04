"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contractApi, influencerApi, campaignApi } from "@/lib/api/services";
import { ApiError, Campaign, CreateContractData } from "@/types";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { User, Instagram, Euro, DollarSign, Calendar } from "lucide-react";

// Create a component that uses useSearchParams
export function CreateContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const influencerId = searchParams.get("influencerId");

  const [formData, setFormData] = useState({
    influencerId: influencerId || "",
    campaignId: "none",
    amount: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    deliverables: "",
    terms: "",
    // New contract fields
    nickname: "",
    link: "",
    contactMethod: "",
    paymentMethod: "",
    managerComment: "",
    statistics: "",
    storyViews: "",
    averageViews: "",
    engagementCount: "",
  });

  const [hasSetInitialData, setHasSetInitialData] = useState(false);

  // Fetch the specific influencer if influencerId is provided
  const { data: influencer } = useQuery({
    queryKey: ["influencer", influencerId],
    queryFn: async () => {
      if (!influencerId) return null;
      const response = await influencerApi.getById(influencerId);
      return response.data;
    },
    enabled: !!influencerId,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await campaignApi.getAll({ limit: 1000 });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateContractData) => contractApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      toast.success("Contract created successfully");

      // Navigate back to the specific influencer page if we came from there
      if (influencerId) {
        router.push(`/influencers/${influencerId}`);
      } else {
        router.push("/contracts");
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Failed to create contract");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.influencerId) {
      toast.error("Please select an influencer");
      return;
    }

    const submitData: CreateContractData = {
      influencerId: formData.influencerId,
      campaignId:
        formData.campaignId !== "none" ? formData.campaignId : undefined,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      currency: formData.currency,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      deliverables: formData.deliverables || undefined,
      terms: formData.terms || undefined,
      // New contract fields
      nickname: formData.nickname || undefined,
      link: formData.link || undefined,
      contactMethod: formData.contactMethod || undefined,
      paymentMethod: formData.paymentMethod || undefined,
      managerComment: formData.managerComment || undefined,
      statistics: formData.statistics || undefined,
      storyViews: formData.storyViews || undefined,
      averageViews: formData.averageViews || undefined,
      engagementCount: formData.engagementCount || undefined,
    };

    createMutation.mutate(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBack = () => {
    if (influencerId) {
      router.push(`/influencers/${influencerId}`);
    } else {
      router.push("/contracts");
    }
  };

  // Set the selected influencer and pre-fill data if provided in URL
  useEffect(() => {
    if (influencer && !hasSetInitialData) {
      requestAnimationFrame(() => {
        setFormData((prev) => ({
          ...prev,
          influencerId: influencer.id,
          amount:
            influencer.priceUSD?.toString() ||
            influencer.priceEUR?.toString() ||
            "",
          currency: influencer.priceUSD
            ? "USD"
            : influencer.priceEUR
            ? "EUR"
            : "USD",
          // Pre-fill influencer data for the new contract fields
          nickname: influencer.nickname || "",
          link: influencer.link || "",
          contactMethod: influencer.contactMethod || "",
          paymentMethod: influencer.paymentMethod || "",
          managerComment: influencer.managerComment || "",
          statistics: influencer.statistics || "",
          storyViews: influencer.storyViews || "",
          averageViews: influencer.averageViews || "",
          engagementCount: influencer.engagementCount || "",
        }));
        setHasSetInitialData(true);
      });
    }
  }, [influencer, hasSetInitialData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Create Contract</h1>
            <p className="text-muted-foreground">
              Create a new contract for an influencer
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Influencer Info & Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Form */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Selection */}
                <div className="space-y-2">
                  <Label htmlFor="campaignId">Campaign</Label>
                  <Select
                    value={formData.campaignId}
                    onValueChange={(value) => handleChange("campaignId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Campaign</SelectItem>
                      {campaigns?.data?.map((campaign: Campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                          {campaign.budget && ` ($${campaign.budget})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount and Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Contract Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleChange("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                    />
                  </div>
                </div>

                {/* New Ready Influencers Fields */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">
                    Contract Specific Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        placeholder="Influencer nickname"
                        value={formData.nickname}
                        onChange={(e) =>
                          handleChange("nickname", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link">Instagram Link</Label>
                      <Input
                        id="link"
                        placeholder="https://instagram.com/username"
                        value={formData.link}
                        onChange={(e) => handleChange("link", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactMethod">Contact Method</Label>
                      <Input
                        id="contactMethod"
                        placeholder="Email, DM, etc."
                        value={formData.contactMethod}
                        onChange={(e) =>
                          handleChange("contactMethod", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Input
                        id="paymentMethod"
                        placeholder="Bank transfer, PayPal, etc."
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          handleChange("paymentMethod", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerComment">Manager Comment</Label>
                    <Textarea
                      id="managerComment"
                      placeholder="Additional comments from manager"
                      rows={2}
                      value={formData.managerComment}
                      onChange={(e) =>
                        handleChange("managerComment", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="statistics">Statistics</Label>
                      <Input
                        id="statistics"
                        placeholder="Engagement rate, reach, etc."
                        value={formData.statistics}
                        onChange={(e) =>
                          handleChange("statistics", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storyViews">Story Views</Label>
                      <Input
                        id="storyViews"
                        placeholder="Average story views"
                        value={formData.storyViews}
                        onChange={(e) =>
                          handleChange("storyViews", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="averageViews">Average Views</Label>
                      <Input
                        id="averageViews"
                        placeholder="Average post views"
                        value={formData.averageViews}
                        onChange={(e) =>
                          handleChange("averageViews", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engagementCount">Engagement Count</Label>
                      <Input
                        id="engagementCount"
                        placeholder="Total engagement"
                        value={formData.engagementCount}
                        onChange={(e) =>
                          handleChange("engagementCount", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Deliverables */}
                <div className="space-y-2">
                  <Label htmlFor="deliverables">Deliverables</Label>
                  <Textarea
                    id="deliverables"
                    placeholder="Describe what the influencer needs to deliver (posts, stories, reels, etc.)"
                    rows={3}
                    value={formData.deliverables}
                    onChange={(e) =>
                      handleChange("deliverables", e.target.value)
                    }
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    placeholder="Specify the terms and conditions of the contract (payment terms, content guidelines, exclusivity, etc.)"
                    rows={4}
                    value={formData.terms}
                    onChange={(e) => handleChange("terms", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full lg:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending ? "Creating..." : "Create Contract"}
              </Button>
            </div>
          </div>

          {/* Right Column - Influencer Details Card */}

          <div className="lg:col-span-1 space-y-6">
            {influencer && (
              <Card>
                <CardHeader>
                  <CardTitle>Influencer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{influencer.name}</p>
                      {influencer.nickname && (
                        <p className="text-xs text-muted-foreground">
                          {influencer.nickname}
                        </p>
                      )}
                    </div>
                  </div>

                  {influencer.instagramHandle && (
                    <div className="flex items-center space-x-3">
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">@{influencer.instagramHandle}</p>
                        {influencer.followers && (
                          <p className="text-xs text-muted-foreground">
                            {influencer.followers.toLocaleString()} followers
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(influencer.priceEUR || influencer.priceUSD) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Suggested Prices:</p>
                      {influencer.priceEUR && (
                        <div className="flex items-center space-x-2">
                          <Euro className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            €{influencer.priceEUR}
                          </span>
                        </div>
                      )}
                      {influencer.priceUSD && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            ${influencer.priceUSD}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
          </div>
        </div>
      </form>
    </div>
  );
}
