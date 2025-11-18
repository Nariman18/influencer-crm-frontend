// frontend/components/ExportControls.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useImportExport } from "@/lib/hooks/useImportExport";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import type { InfluencerStatus } from "@/lib/shared-types";

/**
 * Simple export controls component.
 * Props could be extended to pass filters from parent.
 */
type Props = {
  initialFilters?: {
    status?: InfluencerStatus | "ALL";
    search?: string;
    emailFilter?: "ALL" | "HAS_EMAIL" | "NO_EMAIL";
  };
};

export const ExportControls: React.FC<Props> = ({ initialFilters = {} }) => {
  const currentUser = useCurrentUser();
  const managerId = currentUser?.user?.id;

  const {
    createExportJob,
    watchExportJob,
    exportProgress,
    downloadExportFile,
  } = useImportExport({ managerId });

  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    if (!jobId) return;
    const unsub = watchExportJob(jobId, (payload) => {
      if (payload.done && payload.downloadReady) {
        // optionally auto-download
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const startExport = async () => {
    setLoading(true);
    const res = await createExportJob({
      ...(filters.status && filters.status !== "ALL"
        ? { status: filters.status }
        : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.emailFilter ? { emailFilter: filters.emailFilter } : {}),
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.jobId) {
      setJobId(res.jobId);
      toast.success("Export queued");
    } else {
      toast.error("Unexpected response");
    }
  };

  const onDownload = async () => {
    if (!jobId) {
      toast.error("No export job");
      return;
    }
    const r = await downloadExportFile(jobId);
    if (r.error) toast.error(r.error);
    else toast.success("Download started");
  };

  const state = jobId ? exportProgress[jobId] : null;

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={startExport}
        size="sm"
        variant="outline"
        disabled={loading}
      >
        Export
      </Button>

      <div className="text-sm">
        {state ? (
          state.done ? (
            <button onClick={onDownload} className="underline text-blue-700">
              Download
            </button>
          ) : state.error ? (
            <span className="text-red-600">Error: {state.error}</span>
          ) : (
            <span>
              {state.processed ?? 0}/{state.total ?? "?"}{" "}
              {state.percent ? `(${state.percent}%)` : ""}
            </span>
          )
        ) : null}
      </div>
    </div>
  );
};

export default ExportControls;
