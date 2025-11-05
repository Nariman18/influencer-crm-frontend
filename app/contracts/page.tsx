"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Contract } from "@/types";
import { toast } from "sonner";
import { Search, Download, Eye, Trash2 } from "lucide-react";
import { useContracts } from "@/lib/hooks/useContracts";
import { useDispatch } from "react-redux";
import {
  addSelectedContract,
  clearSelectedContracts,
  removeSelectedContract,
  setSelectedContracts,
} from "@/lib/store/slices/contractSlice";
import { ConfirmationDialog } from "@/components/layout/confirmation-dialog";
import Link from "next/link";
import { ContractStatus } from "@/lib/shared-types";

const statusColors: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  SIGNED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function ContractsPage() {
  const dispatch = useDispatch();
  const {
    contracts,
    pagination,
    filters,
    selectedContracts,
    isLoading,
    updateFilters,
    deleteContract,
    bulkDeleteContracts,
  } = useContracts();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value, page: 1 });
  };

  const handleStatusFilterChange = (value: ContractStatus | "ALL") => {
    updateFilters({ status: value, page: 1 });
  };

  const handleSelectContract = (contract: Contract, checked: boolean) => {
    if (checked) {
      dispatch(addSelectedContract(contract));
    } else {
      dispatch(removeSelectedContract(contract.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      dispatch(setSelectedContracts(contracts));
    } else {
      dispatch(clearSelectedContracts());
    }
  };

  const handleDeleteClick = (id: string) => {
    setContractToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteContract = () => {
    if (!contractToDelete) return;

    deleteContract(contractToDelete, {
      onSuccess: () => {
        toast.success("Contract deleted successfully");
        setDeleteDialogOpen(false);
        setContractToDelete(null);
      },
      onError: () => {
        toast.error("Failed to delete contract");
        setDeleteDialogOpen(false);
        setContractToDelete(null);
      },
    });
  };

  const handleBulkDeleteClick = () => {
    if (selectedContracts.length === 0) {
      toast.error("Please select contracts to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    const ids = selectedContracts.map((contract) => contract.id);
    bulkDeleteContracts(ids, {
      onSuccess: (response) => {
        toast.success(
          `Successfully deleted ${response.data.count} contract(s)`
        );
        dispatch(clearSelectedContracts());
        setBulkDeleteDialogOpen(false);
      },
      onError: () => {
        toast.error("Failed to delete contracts");
        setBulkDeleteDialogOpen(false);
      },
    });
  };

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

  const isAllSelected =
    selectedContracts.length === contracts.length && contracts.length > 0;

  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.totalCount || 0;
  const hasNext = pagination?.hasNext || false;
  const hasPrev = pagination?.hasPrev || false;

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
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
          {selectedContracts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedContracts.length} selected
              </span>
              <Button
                onClick={handleBulkDeleteClick}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                onClick={() => dispatch(clearSelectedContracts())}
                size="sm"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by influencer, campaign, or amount..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status || "ALL"}
              onValueChange={(value) =>
                handleStatusFilterChange(value as ContractStatus | "ALL")
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
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all contracts"
                  />
                </TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No contracts found
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract: Contract) => (
                  <TableRow key={contract.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedContracts.some(
                          (c) => c.id === contract.id
                        )}
                        onCheckedChange={(checked) =>
                          handleSelectContract(contract, checked as boolean)
                        }
                        aria-label={`Select contract for ${contract.influencer?.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {contract.influencer?.name || "Unknown Influencer"}
                      </Link>
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
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {contract.contractFileUrl && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(contract.id)}
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
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrev}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalCount} total)
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNext}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contract"
        description="Are you sure you want to delete this contract? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteContract}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Multiple Contracts"
        description={`Are you sure you want to delete ${selectedContracts.length} contract(s)? This action cannot be undone.`}
        confirmText={`Delete ${selectedContracts.length} Contract(s)`}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </DashboardLayout>
  );
}
