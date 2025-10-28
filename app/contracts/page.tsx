"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { contractApi } from "@/lib/api/services";
import { Contract, ContractStatus } from "@/types";
import { toast } from "sonner";
import { Search, Download, Eye, Trash2 } from "lucide-react";

const statusColors: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  SIGNED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function ContractsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">(
    "ALL"
  );

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const response = await contractApi.getAll();
      return response.data;
    },
  });

  // Filter contracts client-side based on search and status
  const filteredContracts = useMemo(() => {
    if (!contracts?.data) return [];

    return contracts.data.filter((contract: Contract) => {
      const matchesSearch =
        search === "" ||
        contract.influencer?.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        contract.campaign?.name?.toLowerCase().includes(search.toLowerCase()) ||
        contract.amount?.toString().includes(search);

      const matchesStatus =
        statusFilter === "ALL" || contract.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contracts, search, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contractApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete contract");
    },
  });

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contracts</h1>
            <p className="text-muted-foreground mt-2">
              Manage influencer contracts and agreements
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by influencer, campaign, or amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ContractStatus | "ALL")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="SIGNED">Signed</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Contracts Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract: Contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.influencer?.name || "Unknown Influencer"}
                    </TableCell>
                    <TableCell>
                      {contract.campaign?.name || "No Campaign"}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(contract.amount, contract.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[contract.status]}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.startDate
                        ? new Date(contract.startDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {contract.endDate
                        ? new Date(contract.endDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {contract.contractFileUrl && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(contract.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
