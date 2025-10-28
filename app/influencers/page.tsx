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
import { influencerApi } from "@/lib/api/services";
import { Influencer, InfluencerStatus } from "@/types";
import { toast } from "sonner";
import { Plus, Search, Trash2, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

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
          <Link href="/influencers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Influencer
            </Button>
          </Link>
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
              onValueChange={(value) =>
                setStatusFilter(value as InfluencerStatus | "ALL")
              }
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
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : influencers?.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No influencers found
                  </TableCell>
                </TableRow>
              ) : (
                influencers?.data.map((influencer: Influencer) => (
                  <TableRow key={influencer.id}>
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
                      <div className="flex justify-end space-x-2">
                        <Link href={`/influencers/${influencer.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        {influencer.email && (
                          <Link href={`/influencers/${influencer.id}#email`}>
                            <Button variant="ghost" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {influencers.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === influencers.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
