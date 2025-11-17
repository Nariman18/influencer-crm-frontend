"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { ApiError, Influencer } from "@/types";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Mail,
  Users,
  MailCheck,
  MailX,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { BulkSendEmailDialog } from "@/components/emails/bulk-send-email-dialog";
import {
  addSelectedInfluencer,
  clearSelectedInfluencers,
  removeSelectedInfluencer,
  setSelectedInfluencers,
} from "@/lib/store/slices/influencerSlice";
import { useInfluencers } from "@/lib/hooks/useInfluencers";
import { useDispatch } from "react-redux";
import { ConfirmationDialog } from "@/components/layout/confirmation-dialog";
import { InfluencerStatus } from "@/lib/shared-types";
import { influencerApi } from "@/lib/api/services";

const statusColors: Record<InfluencerStatus, string> = {
  NOT_SENT: "bg-gray-100 text-gray-800",
  PING_1: "bg-blue-100 text-blue-800",
  PING_2: "bg-yellow-100 text-yellow-800",
  PING_3: "bg-orange-100 text-orange-800",
  CONTRACT: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export default function InfluencersPage() {
  const dispatch = useDispatch();
  const {
    influencers,
    pagination: apiPagination,
    filters,
    selectedInfluencers,
    isLoading,
    updateFilters,
    deleteInfluencer,
    bulkDeleteInfluencers,
    currentTotalCount,
  } = useInfluencers();

  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [influencerToDelete, setInfluencerToDelete] = useState<string | null>(
    null
  );

  const handleSelectInfluencer = (influencer: Influencer, checked: boolean) => {
    if (checked) {
      dispatch(addSelectedInfluencer(influencer));
    } else {
      dispatch(removeSelectedInfluencer(influencer.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      dispatch(setSelectedInfluencers(influencers));
    } else {
      dispatch(clearSelectedInfluencers());
    }
  };

  const handleDeleteClick = (id: string) => {
    setInfluencerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteInfluencer = () => {
    if (!influencerToDelete) return;

    deleteInfluencer(influencerToDelete, {
      onSuccess: () => {
        toast.success("Influencer deleted successfully");
        setDeleteDialogOpen(false);
        setInfluencerToDelete(null);
      },
      onError: () => {
        toast.error("Failed to delete influencer");
        setDeleteDialogOpen(false);
        setInfluencerToDelete(null);
      },
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateFilters({ page: newPage });
    } else {
      console.warn("⚠️ Invalid page requested:", newPage);
      toast.error("Invalid page number");
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedInfluencers.length === 0) {
      toast.error("Please select influencers to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    const ids = selectedInfluencers.map((influencer) => influencer.id);
    bulkDeleteInfluencers(ids, {
      onSuccess: (response) => {
        toast.success(
          `Successfully deleted ${response.data.count} influencer(s)`
        );
        dispatch(clearSelectedInfluencers());
        setBulkDeleteDialogOpen(false);
      },
      onError: () => {
        toast.error("Failed to delete influencers");
        setBulkDeleteDialogOpen(false);
      },
    });
  };

  const isAllSelected =
    selectedInfluencers.length === influencers.length && influencers.length > 0;

  // Count influencers with emails in current selection
  const influencersWithEmails = selectedInfluencers.filter(
    (influencer) => influencer.email
  );

  // Use pagination directly from API response
  const currentPage = apiPagination?.page || 1;
  const totalPages = apiPagination?.totalPages || 1;
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

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
                <Button
                  onClick={() => setBulkEmailDialogOpen(true)}
                  disabled={influencersWithEmails.length === 0}
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Bulk Email
                  {influencersWithEmails.length > 0 && (
                    <span className="ml-1">
                      ({influencersWithEmails.length})
                    </span>
                  )}
                </Button>
                <Button
                  onClick={handleBulkDeleteClick}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
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
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or Instagram..."
                value={filters.search || ""}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status || "ALL"}
              onValueChange={(value) =>
                updateFilters({ status: value as InfluencerStatus | "ALL" })
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

            {/* Email Filter */}
            <Select
              value={filters.emailFilter || "ALL"}
              onValueChange={(value) =>
                updateFilters({
                  emailFilter: value as "ALL" | "HAS_EMAIL" | "NO_EMAIL",
                })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Influencers
                  </div>
                </SelectItem>
                <SelectItem value="HAS_EMAIL">
                  <div className="flex items-center gap-2">
                    <MailCheck className="h-4 w-4 text-green-600" />
                    Has Email Address
                  </div>
                </SelectItem>
                <SelectItem value="NO_EMAIL">
                  <div className="flex items-center gap-2">
                    <MailX className="h-4 w-4 text-orange-600" />
                    No Email Address
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Show when viewing ALL influencers */}
        {filters.emailFilter === "ALL" && (
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardContent className="p-2 pr-7 pl-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total
                    </p>
                    {/* Use currentTotalCount instead of totalCount from pagination */}
                    <p className="text-2xl font-bold">{currentTotalCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* When filtering by email status */}
        {filters.emailFilter !== "ALL" && (
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardContent className="p-2 pr-7 pl-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {filters.emailFilter === "HAS_EMAIL"
                        ? "Influencers with Email Addresses"
                        : "Influencers without Email Addresses"}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        filters.emailFilter === "HAS_EMAIL"
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {currentTotalCount}
                    </p>
                  </div>
                  {filters.emailFilter === "HAS_EMAIL" ? (
                    <MailCheck className="h-8 w-8 text-green-600" />
                  ) : (
                    <MailX className="h-8 w-8 text-orange-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                <TableHead>
                  <div className="flex items-center gap-1">
                    Email
                    {filters.emailFilter === "HAS_EMAIL" && (
                      <MailCheck className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Automation</TableHead>
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
              ) : influencers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {filters.emailFilter === "HAS_EMAIL"
                      ? "No influencers with email addresses found"
                      : filters.emailFilter === "NO_EMAIL"
                      ? "No influencers without email addresses found"
                      : "No influencers found"}
                  </TableCell>
                </TableRow>
              ) : (
                influencers.map((influencer: Influencer) => (
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {influencer.email ? (
                          <>
                            <MailCheck className="h-3 w-3 text-green-600" />
                            <span className="text-green-700">
                              {influencer.email}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No email
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {influencer.link ? (
                        <Link
                          href={influencer.link}
                          className="hover:underline text-gray-500 hover:text-gray-800 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {influencer.instagramHandle || "View Profile"}
                        </Link>
                      ) : influencer.instagramHandle ? (
                        // Construct link from handle if no direct link
                        <Link
                          href={`${influencer.instagramHandle.replace(
                            "@",
                            ""
                          )}`}
                          className="hover:underline text-gray-500 hover:text-gray-800 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {influencer.instagramHandle}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatNumber(influencer.followers)}</TableCell>
                    <TableCell>
                      {influencer.manager ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {influencer.manager.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {influencer.manager.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[influencer.status]}>
                        {influencer.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {["PING_1", "PING_2", "PING_3"].includes(
                        influencer.status
                      ) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-400 hover:bg-red-50"
                          onClick={async () => {
                            try {
                              const resp = await influencerApi.stopAutomation(
                                influencer.id
                              );
                              toast.success(
                                resp.data?.message || "Automation stopped"
                              );
                              updateFilters({});
                            } catch (err) {
                              console.error(err);
                              toast.error("Failed to stop automation");
                            }
                          }}
                        >
                          Stop
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/influencers/${influencer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(influencer.id)}
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
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="min-w-20"
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="min-w-20"
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
        selectedInfluencers={selectedInfluencers.filter((i) => i.email)}
        onSelectionClear={() => dispatch(clearSelectedInfluencers())}
      />

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Influencer"
        description="Are you sure you want to delete this influencer? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteInfluencer}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Multiple Influencers"
        description={`Are you sure you want to delete ${selectedInfluencers.length} influencer(s)? This action cannot be undone.`}
        confirmText={`Delete ${selectedInfluencers.length} Influencer(s)`}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </DashboardLayout>
  );
}
