"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { influencerApi } from "@/lib/api/services";
import { Influencer, InfluencerStatus } from "@/types";
import { toast } from "sonner";
import { Plus, Search, Trash2, Mail, FileText, Users } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { BulkSendEmailDialog } from "@/components/emails/bulk-send-email-dialog";

const statusColors: Record<InfluencerStatus, string> = {
  PING_1: "bg-blue-100 text-blue-800",
  PING_2: "bg-yellow-100 text-yellow-800",
  PING_3: "bg-orange-100 text-orange-800",
  CONTRACT: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export default function InfluencersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InfluencerStatus | "ALL">(
    "ALL"
  );
  const [selectedInfluencers, setSelectedInfluencers] = useState<Influencer[]>(
    []
  );
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);

  const { data: influencers, isLoading } = useQuery({
    queryKey: ["influencers", page, search, statusFilter],
    queryFn: async () => {
      const response = await influencerApi.getAll({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => influencerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      toast.success("Influencer deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete influencer");
    },
  });

  const handleSelectInfluencer = (influencer: Influencer, checked: boolean) => {
    if (checked) {
      setSelectedInfluencers((prev) => [...prev, influencer]);
    } else {
      setSelectedInfluencers((prev) =>
        prev.filter((i) => i.id !== influencer.id)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && influencers?.data) {
      setSelectedInfluencers(influencers.data);
    } else {
      setSelectedInfluencers([]);
    }
  };

  const clearSelection = () => {
    setSelectedInfluencers([]);
  };

  const isAllSelected =
    influencers?.data &&
    selectedInfluencers.length === influencers.data.length &&
    influencers.data.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Influencers</h1>
            <p className="text-muted-foreground mt-2">
              Manage your influencer database
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedInfluencers.length > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedInfluencers.length} selected
                </Badge>
                <Button
                  onClick={() => setBulkEmailDialogOpen(true)}
                  disabled={!selectedInfluencers.some((i) => i.email)}
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Bulk Email
                </Button>
                <Button variant="outline" onClick={clearSelection} size="sm">
                  Clear
                </Button>
              </div>
            )}
            <Link href="/influencers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Influencer
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or Instagram..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as InfluencerStatus | "ALL");
                clearSelection(); // Clear selection when filter changes
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PING_1">Ping 1</SelectItem>
                <SelectItem value="PING_2">Ping 2</SelectItem>
                <SelectItem value="PING_3">Ping 3</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all influencers"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : influencers?.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No influencers found
                  </TableCell>
                </TableRow>
              ) : (
                influencers?.data.map((influencer: Influencer) => (
                  <TableRow key={influencer.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedInfluencers.some(
                          (i) => i.id === influencer.id
                        )}
                        onCheckedChange={(checked) =>
                          handleSelectInfluencer(influencer, checked as boolean)
                        }
                        aria-label={`Select ${influencer.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/influencers/${influencer.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {influencer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{influencer.email || "-"}</TableCell>
                    <TableCell>
                      {influencer.instagramHandle
                        ? `@${influencer.instagramHandle}`
                        : "-"}
                    </TableCell>
                    <TableCell>{formatNumber(influencer.followers)}</TableCell>
                    <TableCell>
                      {influencer.engagementRate
                        ? `${influencer.engagementRate}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[influencer.status]}>
                        {influencer.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{influencer.niche || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/influencers/${influencer.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(influencer.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {influencers && influencers.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                clearSelection();
              }}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {influencers.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                setPage((p) => p + 1);
                clearSelection();
              }}
              disabled={page === influencers.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Email Dialog */}
      <BulkSendEmailDialog
        open={bulkEmailDialogOpen}
        onOpenChange={setBulkEmailDialogOpen}
        selectedInfluencers={selectedInfluencers}
        onSelectionClear={clearSelection}
      />
    </DashboardLayout>
  );
}
