"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { campaignApi } from "@/lib/api/services";
import { Campaign } from "@/types";
import { toast } from "sonner";
import { Plus, Calendar, Users, DollarSign, Trash2, Edit } from "lucide-react";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await campaignApi.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete campaign");
    },
  });

  const getStatus = (campaign: Campaign) => {
    const now = new Date();
    const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

    if (!campaign.isActive)
      return { status: "inactive", color: "bg-red-100 text-red-800" };
    if (startDate && now < startDate)
      return { status: "upcoming", color: "bg-blue-100 text-blue-800" };
    if (endDate && now > endDate)
      return { status: "completed", color: "bg-gray-100 text-gray-800" };
    return { status: "active", color: "bg-green-100 text-green-800" };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Manage your marketing campaigns
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Campaigns Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading campaigns...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns?.data?.map((campaign: Campaign) => {
              const statusInfo = getStatus(campaign);
              return (
                <Card
                  key={campaign.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge className={statusInfo.color}>
                        {statusInfo.status.charAt(0).toUpperCase() +
                          statusInfo.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {campaign.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {campaign.startDate
                            ? new Date(campaign.startDate).toLocaleDateString()
                            : "No start date"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {campaign._count?.influencers || 0} influencers
                        </span>
                      </div>
                    </div>

                    {campaign.budget && (
                      <div className="flex items-center space-x-1 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          ${campaign.budget.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(campaign.id)}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {campaigns?.data?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                No campaigns found. Create your first campaign to get started.
              </div>
            </CardContent>
          </Card>
        )}

        <CreateCampaignDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </DashboardLayout>
  );
}
