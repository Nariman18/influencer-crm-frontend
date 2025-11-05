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
import { Email } from "@/types";
import { EmailStatus, isValidEmailStatus } from "@/lib/shared-types";
import { Search, AlertCircle, RefreshCw } from "lucide-react";
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

  const {
    data: emailsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["emails", statusFilter],
    queryFn: async () => {
      const params: EmailQueryParams = {};

      if (statusFilter !== "ALL" && isValidEmailStatus(statusFilter)) {
        params.status = statusFilter;
      }

      const response = await emailApi.getAll(params);
      return response.data;
    },
    retry: 1,
    staleTime: 30000,
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
  }, []);

  const emailData = emailsResponse?.data || [];
  // const pagination = emailsResponse?.pagination;

  const filteredEmails = emailData.filter((email: Email) => {
    if (!email?.influencer) return false;

    const matchesSearch =
      search === "" ||
      email.influencer.name?.toLowerCase().includes(search.toLowerCase()) ||
      email.subject?.toLowerCase().includes(search.toLowerCase()) ||
      email.template?.name?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const formatDate = (dateString: string | null | undefined) => {
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
          </div>
        </Card>

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
      </div>
    </DashboardLayout>
  );
}
