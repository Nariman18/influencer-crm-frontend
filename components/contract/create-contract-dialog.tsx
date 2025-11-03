"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { campaignApi } from "@/lib/api/services";
import { Campaign, Influencer, CreateContractData } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Instagram,
  Euro,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer: Influencer;
  onSubmit: (data: CreateContractData) => void;
  isLoading?: boolean;
}

interface ContractFormData {
  campaignId: string;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  deliverables: string;
  terms: string;
}

export function CreateContractDialog({
  open,
  onOpenChange,
  influencer,
  onSubmit,
  isLoading = false,
}: CreateContractDialogProps) {
  // Simple default form data - no complex dependencies
  const defaultFormData: ContractFormData = {
    campaignId: "none", // FIX: Use "none" instead of empty string
    amount:
      influencer.priceUSD?.toString() || influencer.priceEUR?.toString() || "",
    currency: influencer.priceUSD ? "USD" : influencer.priceEUR ? "EUR" : "USD",
    startDate: "",
    endDate: "",
    deliverables: "",
    terms: "",
  };

  const [formData, setFormData] = useState<ContractFormData>(defaultFormData);

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await campaignApi.getAll({ limit: 1000 });
      return response.data;
    },
    enabled: open,
  });

  // Reset form when dialog opens by using the key prop
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when dialog closes
      setFormData(defaultFormData);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: CreateContractData = {
      influencerId: influencer.id,
      // FIX: Only include campaignId if it's not "none"
      campaignId:
        formData.campaignId !== "none" ? formData.campaignId : undefined,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      currency: formData.currency,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      deliverables: formData.deliverables || undefined,
      terms: formData.terms || undefined,
    };

    onSubmit(submitData);
  };

  const handleChange = (field: keyof ContractFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Contract for {influencer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Influencer Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4 space-y-4">
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
                        <span className="text-sm">€{influencer.priceEUR}</span>
                      </div>
                    )}
                    {influencer.priceUSD && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">${influencer.priceUSD}</span>
                      </div>
                    )}
                  </div>
                )}

                {influencer.contactMethod && (
                  <div>
                    <p className="text-sm font-medium">Contact Method</p>
                    <Badge variant="outline" className="text-xs">
                      {influencer.contactMethod}
                    </Badge>
                  </div>
                )}

                {influencer.paymentMethod && (
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-xs text-muted-foreground">
                      {influencer.paymentMethod}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contract Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  {/* Campaign Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="campaignId">Campaign</Label>
                    <Select
                      value={formData.campaignId}
                      onValueChange={(value) =>
                        handleChange("campaignId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* FIX: Use "none" instead of empty string */}
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
                        onValueChange={(value) =>
                          handleChange("currency", value)
                        }
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
                        onChange={(e) =>
                          handleChange("endDate", e.target.value)
                        }
                      />
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

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Contract"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
