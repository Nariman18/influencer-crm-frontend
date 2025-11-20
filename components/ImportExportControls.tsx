// frontend/components/ImportExportControls.tsx
"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useImportExport } from "@/lib/hooks/useImportExport";
import type { User } from "@/types";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { importApi } from "@/lib/api/services";

/**
 * Local type describing the shape returned by your useCurrentUser hook.
 * If your actual hook returns additional properties, you can extend this.
 */
type UseCurrentUserReturn = {
  user?: User | null;
  isAuthenticated?: boolean;
};

export const ImportExportControls: React.FC = () => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Cast the hook return to the typed shape above (no `any`)
  const currentUserReturn = useCurrentUser() as UseCurrentUserReturn;
  const managerId = currentUserReturn?.user?.id;

  const {
    uploadImportFile,
    importProgress,
    createExportJob,
    exportProgress,
    downloadExportFile,
  } = useImportExport({ managerId });

  const [currentImportJob, setCurrentImportJob] = useState<string | null>(null);
  const [currentExportJob, setCurrentExportJob] = useState<string | null>(null);
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const onChooseFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoadingImport(true);
    const result = await uploadImportFile(f);
    setLoadingImport(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.jobId) {
      toast.success("Import queued");
      setCurrentImportJob(result.jobId);
      // Optionally automatically watch via socket: useImportExport watches globally
    } else {
      toast.error("Unexpected server response");
    }

    // clear file input so same file can be selected again if needed
    if (fileRef.current) fileRef.current.value = "";
  };

  const onCancelImport = async () => {
    if (!currentImportJob) {
      toast.error("No import job selected");
      return;
    }
    setCancelling(true);
    try {
      await importApi.cancelJob(currentImportJob);
      toast.success("Cancel requested");

      // Optional: fetch fresh job row to reflect new status in UI (importApi.getJob)
      try {
        const jobResp = await importApi.getJob(currentImportJob);
        // you might want to do something with jobResp.data here if needed
        console.log("Import job after cancel:", jobResp.data);
      } catch (e) {
        // ignore fetch error
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel import job");
    } finally {
      setCancelling(false);
    }
  };

  const startExport = async () => {
    setLoadingExport(true);
    const res = await createExportJob(null);
    setLoadingExport(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (res.jobId) {
      toast.success("Export queued");
      setCurrentExportJob(res.jobId);
    }
  };

  const onDownload = async () => {
    if (!currentExportJob) {
      toast.error("No export job available");
      return;
    }
    const r = await downloadExportFile(currentExportJob);
    if (r.error) toast.error(r.error);
    else toast.success("Download started");
  };

  const importState = currentImportJob
    ? importProgress[currentImportJob] ?? null
    : null;
  const exportState = currentExportJob
    ? exportProgress[currentExportJob] ?? null
    : null;

  const isImportActive = Boolean(
    currentImportJob && !(importState?.done || importState?.error)
  );

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onFile}
        style={{ display: "none" }}
      />
      <Button
        onClick={onChooseFile}
        size="sm"
        disabled={loadingImport || isImportActive}
      >
        Import
      </Button>

      <div className="text-sm">
        {importState ? (
          importState.done ? (
            <span className="text-green-600">Import complete</span>
          ) : importState.error ? (
            <span className="text-red-600">Error: {importState.error}</span>
          ) : (
            <span>Import: {importState.processed ?? 0} rows</span>
          )
        ) : null}
      </div>

      {/* Cancel button — shown only when an import job is active (queued/processing) */}
      {isImportActive && (
        <Button
          onClick={onCancelImport}
          size="sm"
          variant="destructive"
          disabled={cancelling}
        >
          {cancelling ? "Cancelling..." : "Cancel Import"}
        </Button>
      )}

      <Button
        onClick={startExport}
        size="sm"
        variant="outline"
        disabled={loadingExport}
      >
        Export
      </Button>

      <div className="text-sm">
        {exportState ? (
          exportState.done || exportState.downloadReady ? (
            <button onClick={onDownload} className="underline text-blue-700">
              Download
            </button>
          ) : exportState.error ? (
            <span className="text-red-600">Error: {exportState.error}</span>
          ) : (
            <span>
              {exportState.processed ?? 0}/{exportState.total ?? "?"}
            </span>
          )
        ) : null}
      </div>
    </div>
  );
};
