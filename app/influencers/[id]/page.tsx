"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import { influencerApi, emailApi, contractApi } from "@/lib/api/services";
import { InfluencerStatus, ContractStatus } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  FileText,
  Edit,
  Trash2,
  Calendar,
  User,
  Instagram,
  Users,
  BarChart3,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SendEmailDialog } from "@/components/emails/send-email-dialog";

const statusColors: Record<InfluencerStatus, string> = {
  PING_1: "bg-blue-100 text-blue-800",
  PING_2: "bg-yellow-100 text-yellow-800",
  PING_3: "bg-orange-100 text-orange-800",
  CONTRACT: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const contractStatusColors: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  SIGNED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function InfluencerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const influencerId = params.id as string;
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const { data: influencer, isLoading } = useQuery({
    queryKey: ["influencer", influencerId],
    queryFn: async () => {
      const response = await influencerApi.getById(influencerId);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => influencerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      toast.success("Influencer deleted successfully");
      router.push("/influencers");
    },
    onError: () => {
      toast.error("Failed to delete influencer");
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/influencers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{influencer.name}</h1>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={statusColors[influencer.status]}>
                  {influencer.status.replace("_", " ")}
                </Badge>
                {influencer.instagramHandle && (
                  <span className="text-muted-foreground">
                    @{influencer.instagramHandle}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setEmailDialogOpen(true)}
              disabled={!influencer.email}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Link href={`/influencers/${influencer.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => deleteMutation.mutate(influencer.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Followers</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {influencer.followers
                      ? formatNumber(influencer.followers)
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Engagement</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {influencer.engagementRate
                      ? `${influencer.engagementRate}%`
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Emails Sent</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {influencer._count?.emails || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">
                        {influencer.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {influencer.email || "No email provided"}
                      </p>
                    </div>
                  </div>

                  {influencer.instagramHandle && (
                    <div className="flex items-center space-x-2">
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Instagram</p>
                        <p className="text-sm text-muted-foreground">
                          @{influencer.instagramHandle}
                        </p>
                      </div>
                    </div>
                  )}

                  {influencer.country && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Country</p>
                        <p className="text-sm text-muted-foreground">
                          {influencer.country}
                        </p>
                      </div>
                    </div>
                  )}

                  {influencer.niche && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Niche</p>
                        <p className="text-sm text-muted-foreground">
                          {influencer.niche}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Contact</p>
                      <p className="text-sm text-muted-foreground">
                        {influencer.lastContactDate
                          ? new Date(
                              influencer.lastContactDate
                            ).toLocaleDateString()
                          : "Never contacted"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {influencer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {influencer.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contracts & Activity */}
          <div className="space-y-6">
            {/* Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contracts</span>
                  <Link href={`/contracts?influencerId=${influencer.id}`}>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {influencer.contracts && influencer.contracts.length > 0 ? (
                  <div className="space-y-3">
                    {influencer.contracts.slice(0, 3).map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {contract.campaign?.name || "No Campaign"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contract.amount
                              ? `$${contract.amount}`
                              : "No amount"}
                          </p>
                        </div>
                        <Badge
                          className={contractStatusColors[contract.status]}
                        >
                          {contract.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contracts yet
                  </p>
                )}
                <Link href={`/contracts/new?influencerId=${influencer.id}`}>
                  <Button className="w-full mt-4" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Contract
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Emails */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Emails</CardTitle>
              </CardHeader>
              <CardContent>
                {influencer.emails && influencer.emails.length > 0 ? (
                  <div className="space-y-3">
                    {influencer.emails.slice(0, 3).map((email) => (
                      <div key={email.id} className="p-3 border rounded-lg">
                        <p className="text-sm font-medium truncate">
                          {email.subject}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(email.createdAt).toLocaleDateString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {email.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No emails sent yet
                  </p>
                )}
                <Link href={`/emails?influencerId=${influencer.id}`}>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View All Emails
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        influencer={influencer}
      />
    </DashboardLayout>
  );
}
