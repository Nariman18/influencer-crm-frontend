"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import { contractApi, campaignApi } from "@/lib/api/services";
import { UpdateContractData, ContractStatus, ApiError } from "@/types";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const contractId = params.id as string;

  const [formData, setFormData] = useState({
    status: "DRAFT" as ContractStatus,
    amount: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    deliverables: "",
    terms: "",
    contractFileUrl: "",
  });

  const [hasSetInitialData, setHasSetInitialData] = useState(false);

  // Fetch contract data
  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      const response = await contractApi.getById(contractId);
      return response.data;
    },
    enabled: !!contractId,
  });

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await campaignApi.getAll({ limit: 1000 });
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateContractData) =>
      contractApi.update(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
      toast.success("Contract updated successfully");
      router.push("/contracts");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || "Failed to update contract");
    },
  });

  // Populate form when contract data is loaded - fixed useEffect
  useEffect(() => {
    if (contract && !hasSetInitialData) {
      // Use requestAnimationFrame to avoid setting state during render
      requestAnimationFrame(() => {
        setFormData({
          status: contract.status,
          amount: contract.amount?.toString() || "",
          currency: contract.currency || "USD",
          startDate: contract.startDate
            ? new Date(contract.startDate).toISOString().split("T")[0]
            : "",
          endDate: contract.endDate
            ? new Date(contract.endDate).toISOString().split("T")[0]
            : "",
          deliverables: contract.deliverables || "",
          terms: contract.terms || "",
          contractFileUrl: contract.contractFileUrl || "",
        });
        setHasSetInitialData(true);
      });
    }
  }, [contract, hasSetInitialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: UpdateContractData = {
      status: formData.status,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      currency: formData.currency,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      deliverables: formData.deliverables || undefined,
      terms: formData.terms || undefined,
      contractFileUrl: formData.contractFileUrl || undefined,
    };

    updateMutation.mutate(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading contract...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Contract not found
          </h1>
          <Link href="/contracts">
            <Button className="mt-4">Back to Contracts</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/contracts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Contract</h1>
              <p className="text-muted-foreground">
                {contract.influencer?.name} -{" "}
                {contract.campaign?.name || "No Campaign"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Contract Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleChange("status", value as ContractStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="SIGNED">Signed</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount and Currency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => handleChange("amount", e.target.value)}
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
                      <Label htmlFor="startDate">Start Date</Label>
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
                      <Label htmlFor="endDate">End Date</Label>
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

                  {/* Contract File URL */}
                  <div className="space-y-2">
                    <Label htmlFor="contractFileUrl">Contract File URL</Label>
                    <Input
                      id="contractFileUrl"
                      placeholder="https://example.com/contract.pdf"
                      value={formData.contractFileUrl}
                      onChange={(e) =>
                        handleChange("contractFileUrl", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Contract Terms */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Deliverables */}
                  <div className="space-y-2">
                    <Label htmlFor="deliverables">Deliverables</Label>
                    <Textarea
                      id="deliverables"
                      placeholder="Describe what the influencer needs to deliver..."
                      rows={4}
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
                      placeholder="Specify the terms and conditions of the contract..."
                      rows={6}
                      value={formData.terms}
                      onChange={(e) => handleChange("terms", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full lg:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Updating..." : "Update Contract"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
