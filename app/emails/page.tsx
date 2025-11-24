"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { emailApi } from "@/lib/api/services";
import { Email, PaginatedResponse } from "@/types";
import { EmailStatus, isValidEmailStatus } from "@/lib/shared-types";
import {
  Search,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type StatusFilter = EmailStatus | "ALL";

interface EmailQueryParams {
  page?: number;
  limit?: number;
  status?: EmailStatus;
  influencerId?: string;
}

const statusColors: Record<EmailStatus, string> = {
  [EmailStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [EmailStatus.QUEUED]: "bg-blue-100 text-blue-800",
  [EmailStatus.PROCESSING]: "bg-orange-100 text-orange-800",
  [EmailStatus.SENT]: "bg-green-100 text-green-800",
  [EmailStatus.FAILED]: "bg-red-100 text-red-800",
  [EmailStatus.OPENED]: "bg-purple-100 text-purple-800",
  [EmailStatus.REPLIED]: "bg-indigo-100 text-indigo-800",
};

export default function EmailsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
    data: emailsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<Email>>({
    queryKey: ["emails", statusFilter, currentPage, pageSize],
    queryFn: async (): Promise<PaginatedResponse<Email>> => {
      const params: EmailQueryParams = {
        page: currentPage,
        limit: pageSize,
      };

      if (statusFilter !== "ALL" && isValidEmailStatus(statusFilter)) {
        params.status = statusFilter;
      }

      const response = await emailApi.getAll(params);
      return response.data;
    },
    retry: 1,
    staleTime: 15000,
    refetchInterval: 10000,
    placeholderData: (previousData) => previousData, // React Query v5: Keep showing old data
  });

  const handleStatusChange = useCallback((value: string) => {
    if (value === "ALL") {
      setStatusFilter("ALL");
    } else if (isValidEmailStatus(value)) {
      setStatusFilter(value);
    } else {
      console.warn("Invalid EmailStatus value:", value);
      setStatusFilter("ALL");
    }
    // Reset to page 1 when filter changes
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    const newSize = parseInt(value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const emailData: Email[] = emailsResponse?.data ?? [];
  const pagination = emailsResponse?.pagination;

  // Client-side search filtering (only on current page)
  const filteredEmails = emailData.filter((email: Email) => {
    if (!email?.influencer) return false;

    const matchesSearch =
      search === "" ||
      email.influencer.name?.toLowerCase().includes(search.toLowerCase()) ||
      email.subject?.toLowerCase().includes(search.toLowerCase()) ||
      email.template?.name?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: EmailStatus) => {
    const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";
    return <Badge className={colorClass}>{status}</Badge>;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleGoToPage = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = (): (number | string)[] => {
    if (!pagination) return [];

    const { totalPages } = pagination;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load emails. Please try again.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sent Emails</h1>
            <p className="text-muted-foreground mt-2">
              Track your email outreach campaigns
            </p>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by influencer, subject, or template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value={EmailStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={EmailStatus.QUEUED}>Queued</SelectItem>
                <SelectItem value={EmailStatus.PROCESSING}>
                  Processing
                </SelectItem>
                <SelectItem value={EmailStatus.SENT}>Sent</SelectItem>
                <SelectItem value={EmailStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={EmailStatus.OPENED}>Opened</SelectItem>
                <SelectItem value={EmailStatus.REPLIED}>Replied</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
                <SelectItem value="200">200 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Pagination Info */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} emails
            </div>
            <div>
              Page {pagination.page} of {pagination.totalPages}
            </div>
          </div>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Replied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading emails...
                  </TableCell>
                </TableRow>
              ) : filteredEmails.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search ? "No emails match your search" : "No emails found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmails.map((email: Email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">
                      {email.influencer?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {email.subject || "No subject"}
                    </TableCell>
                    <TableCell>{email.template?.name || "Custom"}</TableCell>
                    <TableCell>{getStatusBadge(email.status)}</TableCell>
                    <TableCell>{formatDate(email.sentAt)}</TableCell>
                    <TableCell>{formatDate(email.openedAt)}</TableCell>
                    <TableCell>{formatDate(email.repliedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <Card className="p-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-2">
                {getPageNumbers().map((page, index) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2">
                        ...
                      </span>
                    );
                  }

                  const pageNum = page as number;
                  const isActive = pageNum === currentPage;

                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGoToPage(pageNum)}
                      disabled={isLoading}
                      className={isActive ? "" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= pagination.totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
