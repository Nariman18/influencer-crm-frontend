// frontend/lib/hooks/useImportExport.ts
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { initSocketClient } from "@/lib/socket";
import { importApi, exportApi } from "@/lib/api/services";
import type { AxiosResponse, AxiosError } from "axios";

/**
 * Progress shapes emitted by backend over socket.io
 */
export type ImportProgress = {
  jobId: string;
  processed?: number;
  success?: number;
  failed?: number;
  duplicatesCount?: number;
  done?: boolean;
  error?: string;
};

export type ExportProgress = {
  jobId: string;
  processed?: number;
  total?: number;
  percent?: number | null;
  done?: boolean;
  downloadReady?: boolean;
  error?: string;
};

/**
 * Return types for some API calls used here
 */
type UploadFileResponse = { message?: string; jobId: string };
type CreateExportResponse = { message?: string; jobId: string };
type ImportJobRow = {
  id: string;
  managerId: string;
  filename: string;
  filePath: string;
  status: string;
  totalRows?: number;
  successCount?: number;
  failedCount?: number;
  duplicates?: unknown;
  errors?: unknown;
  createdAt?: string;
  updatedAt?: string;
};
type ExportJobRow = {
  id: string;
  managerId: string;
  filters?: Record<string, unknown> | null;
  filePath?: string | null;
  status: string;
  totalRows?: number;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Safely extract an error message from unknown errors coming from Axios or Error objects.
 * Avoids using `any` and handles common shapes.
 */
function extractErrorMessage(err: unknown): string {
  // Try treating as AxiosError
  const maybeAxios = err as AxiosError | undefined;

  // Avoid `any` — use a safe `in` check for config property on object
  const looksLikeAxios =
    !!maybeAxios &&
    (maybeAxios.isAxiosError === true ||
      (typeof maybeAxios === "object" &&
        maybeAxios !== null &&
        "config" in (maybeAxios as object)));

  if (looksLikeAxios) {
    // axios error
    const respData = maybeAxios!.response?.data as unknown;
    if (respData && typeof respData === "object") {
      const record = respData as Record<string, unknown>;
      const msg = record["message"] ?? record["error"];
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
    if (
      typeof maybeAxios!.message === "string" &&
      maybeAxios!.message.length > 0
    )
      return maybeAxios!.message;
    return "Request failed";
  }

  if (err instanceof Error) {
    return err.message || "Unknown error";
  }

  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

export const useImportExport = (opts: { managerId?: string } = {}) => {
  const { managerId } = opts;
  const socketRef = useRef<Socket | null>(null);

  const [importProgress, setImportProgress] = useState<
    Record<string, ImportProgress>
  >({});
  const [exportProgress, setExportProgress] = useState<
    Record<string, ExportProgress>
  >({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = initSocketClient(localStorage.getItem("token") || undefined);
      socketRef.current = s;

      s.on("connect", () => {
        if (managerId) {
          // join the manager room so server only emits relevant events
          try {
            s.emit("join", managerId);
          } catch {
            // ignore join errors
          }
        }
      });

      const importHandler = (payload: ImportProgress) => {
        if (!payload?.jobId) return;
        setImportProgress((prev) => ({ ...prev, [payload.jobId]: payload }));
      };

      const exportHandler = (payload: ExportProgress) => {
        if (!payload?.jobId) return;
        setExportProgress((prev) => ({ ...prev, [payload.jobId]: payload }));
      };

      s.on("import:progress", importHandler);
      s.on("export:progress", exportHandler);

      s.on("connect_error", (err) => {
        // do not crash — just log and set local error state asynchronously
        console.warn("Socket connect_error", err);
        queueMicrotask(() => setError(extractErrorMessage(err)));
      });

      return () => {
        try {
          s.off("import:progress", importHandler);
          s.off("export:progress", exportHandler);
        } catch {
          // ignore
        }
        // Don't disconnect singleton socket here.
      };
    } catch (e) {
      console.warn("Socket init failed:", e);
      // schedule state update to avoid synchronous setState in effect body
      queueMicrotask(() => setError(extractErrorMessage(e)));
    }
  }, [managerId]);

  /**
   * Upload import file (multipart/form-data)
   * returns { jobId } on success or { error } on failure
   */
  const uploadImportFile = async (
    file: File
  ): Promise<{ jobId?: string; error?: string }> => {
    try {
      const resp: AxiosResponse<UploadFileResponse> =
        await importApi.uploadFile(file);
      const jobId = resp.data?.jobId;
      if (!jobId) {
        return { error: "Server did not return jobId" };
      }
      return { jobId };
    } catch (err: unknown) {
      console.error("uploadImportFile error", err);
      const msg = extractErrorMessage(err);
      return { error: msg };
    }
  };

  /**
   * Get import job row (one-off)
   */
  const getImportJob = async (jobId: string): Promise<ImportJobRow> => {
    const resp: AxiosResponse<ImportJobRow> = await importApi.getJob(jobId);
    return resp.data;
  };

  /**
   * Create export job (returns jobId)
   */
  const createExportJob = async (
    filters?: Record<string, unknown> | null
  ): Promise<{ jobId?: string; error?: string }> => {
    try {
      const resp: AxiosResponse<CreateExportResponse> =
        await exportApi.createExportJob(filters);
      const jobId = resp.data?.jobId;
      if (!jobId) return { error: "Server did not return jobId" };
      return { jobId };
    } catch (err: unknown) {
      console.error("createExportJob error", err);
      const msg = extractErrorMessage(err);
      return { error: msg };
    }
  };

  const getExportJob = async (jobId: string): Promise<ExportJobRow> => {
    const resp: AxiosResponse<ExportJobRow> = await exportApi.getJob(jobId);
    return resp.data;
  };

  /**
   * Download export file using native fetch so we can handle blob
   */
  const downloadExportFile = async (
    jobId: string
  ): Promise<{ ok?: true; error?: string }> => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "";
      const baseNormalized = base.replace(/\/$/, "");
      const apiBase = baseNormalized.includes("/api")
        ? baseNormalized
        : `${baseNormalized}/api`;
      const url = `${apiBase}/export/${jobId}/download`;
      const resp = await fetch(url, { method: "GET", credentials: "include" });
      if (!resp.ok) {
        const text = await resp.text().catch(() => null);
        return { error: text || `Failed to download: ${resp.status}` };
      }
      const disposition = resp.headers.get("content-disposition");
      const blob = await resp.blob();
      const filename =
        disposition?.match(/filename="?([^"]+)"?/)?.[1] ||
        `influencers-export-${jobId}.xlsx`;
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      return { ok: true };
    } catch (err: unknown) {
      console.error("downloadExportFile error", err);
      return { error: extractErrorMessage(err) };
    }
  };

  /**
   * Helpers to subscribe to socket events for a specific job
   * Returns an unsubscribe function
   */
  const watchImportJob = (
    jobId: string,
    onUpdate?: (payload: ImportProgress) => void
  ): (() => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    const handler = (payload: ImportProgress) => {
      if (payload?.jobId === jobId) {
        setImportProgress((prev) => ({ ...prev, [jobId]: payload }));
        onUpdate?.(payload);
      }
    };
    s.on("import:progress", handler);
    return () => s.off("import:progress", handler);
  };

  const watchExportJob = (
    jobId: string,
    onUpdate?: (payload: ExportProgress) => void
  ): (() => void) => {
    const s = socketRef.current;
    if (!s) return () => {};
    const handler = (payload: ExportProgress) => {
      if (payload?.jobId === jobId) {
        setExportProgress((prev) => ({ ...prev, [jobId]: payload }));
        onUpdate?.(payload);
      }
    };
    s.on("export:progress", handler);
    return () => s.off("export:progress", handler);
  };

  return {
    importProgress,
    exportProgress,
    error,

    // import
    uploadImportFile,
    getImportJob,
    watchImportJob,

    // export
    createExportJob,
    getExportJob,
    watchExportJob,
    downloadExportFile,
  } as const;
};
