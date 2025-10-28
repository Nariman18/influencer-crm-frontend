"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import { emailApi } from "@/lib/api/services";
import { Email, EmailStatus } from "@/types";
import { Search } from "lucide-react";

const statusColors: Record<EmailStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  OPENED: "bg-blue-100 text-blue-800",
  REPLIED: "bg-purple-100 text-purple-800",
};

export default function EmailsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmailStatus | "ALL">("ALL");

  const { data: emails, isLoading } = useQuery({
    queryKey: ["emails", search, statusFilter],
    queryFn: async () => {
      // Remove the search parameter since it's not in the API type
      const response = await emailApi.getAll({
        // You can add influencerId or other valid params here if needed
      });
      return response.data;
    },
  });

  // Filter emails client-side based on search
  const filteredEmails = emails?.data?.filter((email: Email) => {
    const matchesSearch =
      search === "" ||
      email.influencer?.name.toLowerCase().includes(search.toLowerCase()) ||
      email.subject.toLowerCase().includes(search.toLowerCase()) ||
      (email.template?.name &&
        email.template.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || email.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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

        {/* Filters */}
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
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as EmailStatus | "ALL")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="OPENED">Opened</SelectItem>
                <SelectItem value="REPLIED">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Emails Table */}
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
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredEmails?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No emails found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmails?.map((email: Email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">
                      {email.influencer?.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>{email.template?.name || "Custom"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[email.status]}>
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {email.sentAt ? formatDate(email.sentAt) : "-"}
                    </TableCell>
                    <TableCell>
                      {email.openedAt ? formatDate(email.openedAt) : "-"}
                    </TableCell>
                    <TableCell>
                      {email.repliedAt ? formatDate(email.repliedAt) : "-"}
                    </TableCell>
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
