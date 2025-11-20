"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { contractApi } from "@/lib/api/services";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Eye,
  Download,
  Calendar,
  Euro,
  DollarSign,
  User,
  Instagram,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { ContractStatus } from "@/lib/shared-types";

const statusColors: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  SIGNED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const formatCurrency = (
  amount: number | undefined,
  currency: string = "USD"
) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

const formatDate = (date: string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const {
    data: contract,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      try {
        const response = await contractApi.getById(contractId);
        return response.data;
      } catch (err) {
        console.error("Error fetching contract:", err);
        throw err;
      }
    },
    enabled: !!contractId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading contract details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !contract) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Contract not found
          </h1>
          <p className="text-muted-foreground mt-2">
            The contract you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/contracts">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
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
                Back to Contracts
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Contract Details</h1>
              <p className="text-muted-foreground">
                {contract.influencer?.name} -{" "}
                {contract.campaign?.name || "No Campaign"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/contracts/${contractId}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Contract
              </Button>
            </Link>
            {contract.contractFileUrl && (
              <Button variant="outline" asChild>
                <a
                  href={contract.contractFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Contract
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contract Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Status & Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Contract Overview
                  <Badge className={statusColors[contract.status]}>
                    {contract.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Amount
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(contract.amount, contract.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Currency
                    </p>
                    <p className="text-lg font-semibold">{contract.currency}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Start Date
                    </p>
                    <p className="text-sm">{formatDate(contract.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      End Date
                    </p>
                    <p className="text-sm">{formatDate(contract.endDate)}</p>
                  </div>
                </div>

                {contract.signedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Signed Date
                    </p>
                    <p className="text-sm">{formatDate(contract.signedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Specific Details */}
            {(contract.nickname ||
              contract.contactMethod ||
              contract.paymentMethod ||
              contract.managerComment ||
              contract.statistics ||
              contract.storyViews ||
              contract.averageViews ||
              contract.engagementCount) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contract Specific Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {contract.nickname && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Nickname
                        </p>
                        <p className="text-sm">{contract.nickname}</p>
                      </div>
                    )}
                    {contract.link ? (
                      <a
                        href={String(contract.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        {contract.link}
                      </a>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {contract.contactMethod && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Contact Method
                        </p>
                        <p className="text-sm">{contract.contactMethod}</p>
                      </div>
                    )}
                    {contract.paymentMethod && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Payment Method
                        </p>
                        <p className="text-sm">{contract.paymentMethod}</p>
                      </div>
                    )}
                  </div>

                  {contract.managerComment && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Manager Comment
                      </p>
                      <p className="text-sm">{contract.managerComment}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {contract.statistics && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Statistics
                        </p>
                        <p className="text-sm">{contract.statistics}</p>
                      </div>
                    )}
                    {contract.storyViews && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Story Views
                        </p>
                        <p className="text-sm">{contract.storyViews}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {contract.averageViews && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Average Views
                        </p>
                        <p className="text-sm">{contract.averageViews}</p>
                      </div>
                    )}
                    {contract.engagementCount && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Engagement Count
                        </p>
                        <p className="text-sm">{contract.engagementCount}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deliverables */}
            {contract.deliverables && (
              <Card>
                <CardHeader>
                  <CardTitle>Deliverables</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {contract.deliverables}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Terms & Conditions */}
            {contract.terms && (
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {contract.terms}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Influencer & Campaign Info */}
          <div className="space-y-6">
            {/* Influencer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Influencer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-sm font-semibold">
                    {contract.influencer?.name}
                  </p>
                </div>

                {contract.influencer?.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm">{contract.influencer.email}</p>
                  </div>
                )}

                {contract.influencer?.instagramHandle && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <Instagram className="h-4 w-4 inline mr-1" />
                      Instagram
                    </p>
                    <p className="text-sm">
                      @{contract.influencer.instagramHandle}
                    </p>
                  </div>
                )}

                {contract.influencer?.followers && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Followers
                    </p>
                    <p className="text-sm">
                      {contract.influencer.followers.toLocaleString()}
                    </p>
                  </div>
                )}

                {contract.influencer?.id ? (
                  <Link href={`/influencers/${contract.influencer.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Influencer
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Influencer
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Campaign Information */}
            {contract.campaign && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="text-sm font-semibold">
                      {contract.campaign.name}
                    </p>
                  </div>

                  {contract.campaign.budget && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Budget
                      </p>
                      <p className="text-sm">${contract.campaign.budget}</p>
                    </div>
                  )}

                  {contract.campaign.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Description
                      </p>
                      <p className="text-sm">{contract.campaign.description}</p>
                    </div>
                  )}

                  <Link href={`/campaigns/${contract.campaign.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Campaign
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Contract Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Created
                  </p>
                  <p className="text-sm">{formatDate(contract.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm">{formatDate(contract.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Contract ID
                  </p>
                  <p className="text-sm font-mono text-xs">{contract.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
