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
import { Influencer } from "@/types";
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
  MapPin,
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
import { ImportExportControls } from "@/components/ImportExportControls";
import { useQuery } from "@tanstack/react-query";

const statusColors: Record<InfluencerStatus, string> = {
  NOT_SENT: "bg-gray-100 text-gray-800",
  PING_1: "bg-blue-100 text-blue-800",
  PING_2: "bg-yellow-100 text-yellow-800",
  PING_3: "bg-orange-100 text-orange-800",
  CONTRACT: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

// Helper function to extract Instagram username from URL
const extractInstagramUsername = (url: string | null | undefined): string => {
  if (!url) return "-";

  const urlStr = String(url);

  // If it's already just a username (no URL), return it
  if (!urlStr.includes("/") && !urlStr.includes("instagram.com")) {
    return urlStr.replace(/^@+/, "").trim();
  }

  try {
    // Extract username from Instagram URL patterns
    const patterns = [
      /instagram\.com\/([A-Za-z0-9._]+)(?:\/|$|\?)/i,
      /instagr\.am\/([A-Za-z0-9._]+)(?:\/|$|\?)/i,
    ];

    for (const pattern of patterns) {
      const match = urlStr.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/^@/, "").trim();
      }
    }

    // If no pattern matches but it looks like a URL, return the last part
    if (urlStr.includes("instagram.com") || urlStr.includes("instagr.am")) {
      const parts = urlStr.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (
        lastPart &&
        lastPart !== "instagram.com" &&
        lastPart !== "instagr.am"
      ) {
        return lastPart.replace(/^@/, "").split("?")[0].trim();
      }
    }

    // Fallback: return the original if it's short enough
    return urlStr.length > 30 ? "View Profile" : urlStr;
  } catch {
    return "View Profile";
  }
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
  const [stoppedAutomations, setStoppedAutomations] = useState<Set<string>>(
    new Set()
  );
  const [stoppingAutomation, setStoppingAutomation] = useState<string | null>(
    null
  );

  const { data: countriesData } = useQuery({
    queryKey: ["countries"],
    queryFn: () => influencerApi.getCountries(),
    staleTime: 5 * 60 * 1000,
  });

  const availableCountries = countriesData?.countries || [];

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

  const influencersWithEmails = selectedInfluencers.filter(
    (influencer) => influencer.email
  );

  const currentPage = apiPagination?.page || 1;
  const totalPages = apiPagination?.totalPages || 1;

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

            <div className="flex items-center gap-2">
              <ImportExportControls />
            </div>

            <Link href="/influencers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Influencer
              </Button>
            </Link>
          </div>
        </div>

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
                <SelectItem value="NOT_SENT">Not Sent</SelectItem>
                <SelectItem value="PING_1">Ping 1</SelectItem>
                <SelectItem value="PING_2">Ping 2</SelectItem>
                <SelectItem value="PING_3">Ping 3</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>

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

            <Select
              value={filters.country || "ALL"}
              onValueChange={(value) =>
                updateFilters({
                  country: value === "ALL" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    All Countries
                  </div>
                </SelectItem>
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      {country}
                    </div>
                  </SelectItem>
                ))}
                {availableCountries.length === 0 && (
                  <SelectItem value="NONE" disabled>
                    <span className="text-muted-foreground text-sm">
                      No countries available
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {filters.emailFilter === "ALL" && (
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardContent className="p-2 pr-7 pl-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total
                    </p>
                    <p className="text-2xl font-bold">{currentTotalCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead className="w-[220px]">
                  <div className="flex items-center gap-1">
                    Email
                    {filters.emailFilter === "HAS_EMAIL" && (
                      <MailCheck className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-[140px]">Instagram</TableHead>
                <TableHead className="w-[140px]">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Country
                  </div>
                </TableHead>
                <TableHead className="w-[180px]">Manager</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Automation</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : influencers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
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
                    <TableCell className="font-medium max-w-[180px] truncate">
                      <Link
                        href={`/influencers/${influencer.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {influencer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="flex items-center gap-1 truncate">
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
                    <TableCell className="max-w-[140px] truncate">
                      {influencer.link || influencer.instagramHandle ? (
                        <a
                          href={
                            influencer.link
                              ? String(influencer.link)
                              : influencer.instagramHandle?.includes(
                                  "instagram.com"
                                )
                              ? String(influencer.instagramHandle)
                              : `https://instagram.com/${encodeURIComponent(
                                  String(influencer.instagramHandle).replace(
                                    /^@+/,
                                    ""
                                  )
                                )}`
                          }
                          className="hover:underline text-gray-500 hover:text-gray-800 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {extractInstagramUsername(
                            influencer.link || influencer.instagramHandle
                          )}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[140px]">
                      {influencer.country ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-600" />
                          <span className="text-sm">{influencer.country}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
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
                      {stoppedAutomations.has(influencer.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-400 border-gray-300 cursor-not-allowed"
                          disabled
                        >
                          Stopped
                        </Button>
                      ) : ["PING_1", "PING_2", "PING_3"].includes(
                          influencer.status
                        ) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-400 hover:bg-red-50"
                          disabled={stoppingAutomation === influencer.id}
                          onClick={async () => {
                            try {
                              setStoppingAutomation(influencer.id);
                              const resp = await influencerApi.stopAutomation(
                                influencer.id
                              );
                              toast.success(
                                resp.data?.message || "Automation stopped"
                              );
                              setStoppedAutomations((prev) =>
                                new Set(prev).add(influencer.id)
                              );
                              updateFilters({});
                            } catch (err) {
                              console.error(err);
                              toast.error("Failed to stop automation");
                            } finally {
                              setStoppingAutomation(null);
                            }
                          }}
                        >
                          {stoppingAutomation === influencer.id
                            ? "Stopping..."
                            : "Stop"}
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

      <BulkSendEmailDialog
        open={bulkEmailDialogOpen}
        onOpenChange={setBulkEmailDialogOpen}
        selectedInfluencers={selectedInfluencers.filter((i) => i.email)}
        onSelectionClear={() => dispatch(clearSelectedInfluencers())}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Influencer"
        description="Are you sure you want to delete this influencer? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteInfluencer}
      />

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
