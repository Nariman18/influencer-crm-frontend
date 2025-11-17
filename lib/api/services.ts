// frontend/lib/api/services.ts
import {
  ApiError,
  AuthResponse,
  BulkOperationResult,
  Campaign,
  Contract,
  DashboardStats,
  Email,
  EmailTemplate,
  ImportInfluencerData,
  Influencer,
  PaginatedResponse,
  User,
} from "@/types";
import apiClient from "./client";
import { ContractStatus, EmailStatus, InfluencerStatus } from "../shared-types";

type QueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;

  [key: string]: number;
};

type QueueMeta = {
  emailName?: string;
  automationName?: string;
  prefix?: string | undefined;
};

export type QueueStatsResponse = {
  connection: boolean;
  email: QueueCounts;
  automation: QueueCounts;
  meta?: QueueMeta;
};

export type QueueHealthResponse = {
  healthy: boolean;
  connection: string;
  timestamp: string;
  queues: {
    email: {
      status: string;
      totalJobs: number;
      pending: number;
      breakdown: QueueCounts;
    };
    automation: {
      status: string;
      totalJobs: number;
      pending: number;
      breakdown: QueueCounts;
    };
  };
};

type QueuePerformance = {
  emailQueue: {
    throughput: string;
    failureRate: string;
    backlog: number;
    efficiency: string;
    activeWorkers: number;
  };
  automationQueue: {
    throughput: string;
    failureRate: string;
    backlog: number;
    efficiency: string;
    activeWorkers: number;
  };
};

type QueueMetricsData = {
  performance: QueuePerformance;
  recommendations: {
    email: string;
    automation: string;
  };
  timestamp: string;
};

type QueueConfigData = {
  environment: string;
  redis: {
    urlConfigured: boolean;
  };
  limits: {
    dailyEmails: number;
    emailConcurrency: number;
    automationConcurrency: number;
    emailsPerMinute: number;
  };
  delays: {
    betweenEmails: string;
    automation: string;
  };
  providers: {
    mailgun: { configured: boolean; domain: string | null };
    gmail: { note: string };
  };
};

/** Auth API */
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) => apiClient.post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/login", data),

  getProfile: () => apiClient.get<User>("/auth/profile"),

  updateProfile: (data: { name: string; email: string }) =>
    apiClient.put<User>("/auth/profile", data),

  // Exchange OAuth code (public)
  exchangeToken: (code: string) =>
    apiClient.post<{
      accessToken: string;
      refreshToken: string;
      email: string;
      expiresIn?: number;
    }>("/auth/google/exchange-token", { code }),

  // OAuth connect/disconnect (requires auth)
  connectGoogle: (data: {
    accessToken: string;
    refreshToken: string;
    email: string;
  }) =>
    apiClient.post<{ message: string; hasGoogleAuth: boolean }>(
      "/auth/google/connect",
      data
    ),

  disconnectGoogle: () =>
    apiClient.post<{ message: string; hasGoogleAuth: boolean }>(
      "/auth/google/disconnect"
    ),
};

/** Influencer API */
export const influencerApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: InfluencerStatus;
    search?: string;
    emailFilter?: string;
  }) =>
    apiClient.get<PaginatedResponse<Influencer>>("/influencers", { params }),

  getById: (id: string) => apiClient.get<Influencer>(`/influencers/${id}`),

  create: (data: Partial<Influencer>) =>
    apiClient.post<Influencer>("/influencers", data),

  update: (id: string, data: Partial<Influencer>) =>
    apiClient.put<Influencer>(`/influencers/${id}`, data),

  delete: (id: string) => apiClient.delete(`/influencers/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.post<{ message: string; count: number }>(
      "/influencers/bulk-delete",
      { ids }
    ),

  stopAutomation: (id: string) =>
    apiClient.post(`/influencers/${id}/automation/cancel`),

  bulkUpdateStatus: (ids: string[], status: InfluencerStatus) =>
    apiClient.post<{ message: string; count: number }>(
      "/influencers/bulk/update-status",
      { ids, status }
    ),

  import: (influencers: ImportInfluencerData[]) =>
    apiClient.post<{ success: number; failed: number; errors?: ApiError[] }>(
      "/influencers/import",
      { influencers }
    ),

  checkDuplicates: (data: {
    email?: string;
    instagramHandle?: string;
    excludeId?: string;
  }) =>
    apiClient.post<{
      isDuplicate: boolean;
      duplicate?: {
        id: string;
        name: string;
        email?: string;
        instagramHandle?: string;
        status: string;
      };
    }>("/influencers/check-duplicates", data),
};

/** Contract API */
export const contractApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: ContractStatus;
    campaignId?: string;
  }) => apiClient.get<PaginatedResponse<Contract>>("/contracts", { params }),

  getById: (id: string) => apiClient.get<Contract>(`/contracts/${id}`),

  create: (data: Partial<Contract>) =>
    apiClient.post<Contract>("/contracts", data),

  update: (id: string, data: Partial<Contract>) =>
    apiClient.put<Contract>(`/contracts/${id}`, data),

  delete: (id: string) => apiClient.delete(`/contracts/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.post<{ message: string; count: number }>(
      "/contracts/bulk-delete",
      { ids }
    ),
};

/** Campaign API */
export const campaignApi = {
  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    apiClient.get<PaginatedResponse<Campaign>>("/campaigns", { params }),

  getById: (id: string) => apiClient.get<Campaign>(`/campaigns/${id}`),

  create: (data: Partial<Campaign>) =>
    apiClient.post<Campaign>("/campaigns", data),

  update: (id: string, data: Partial<Campaign>) =>
    apiClient.put<Campaign>(`/campaigns/${id}`, data),

  delete: (id: string) => apiClient.delete(`/campaigns/${id}`),

  addInfluencer: (id: string, influencerId: string) =>
    apiClient.post(`/campaigns/${id}/influencers`, { influencerId }),

  removeInfluencer: (id: string, influencerId: string) =>
    apiClient.delete(`/campaigns/${id}/influencers/${influencerId}`),
};

/** Email Template API */
export const emailTemplateApi = {
  // keep path consistent with server routes (adjust if server mounts differently)
  getAll: (params?: { isActive?: boolean }) =>
    apiClient.get<EmailTemplate[]>("/email-templates", { params }),

  getById: (id: string) =>
    apiClient.get<EmailTemplate>(`/email-templates/${id}`),

  create: (data: Partial<EmailTemplate>) =>
    apiClient.post<EmailTemplate>("/email-templates", data),

  update: (id: string, data: Partial<EmailTemplate>) =>
    apiClient.put<EmailTemplate>(`/email-templates/${id}`, data),

  delete: (id: string) => apiClient.delete(`/email-templates/${id}`),
};

/** Email API */
export const emailApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    influencerId?: string;
    status?: EmailStatus;
  }) => apiClient.get<PaginatedResponse<Email>>("/emails", { params }),

  validateConfig: () =>
    apiClient.get<{
      isValid: boolean;
      message: string;
      hasTokens: boolean;
      gmailAddress?: string;
      userName?: string;
    }>("/emails/config/validate"),

  send: (data: {
    influencerId: string;
    templateId?: string;
    subject?: string;
    body?: string;
    variables?: Record<string, string>;
    provider?: "gmail" | "mailgun";
  }) => apiClient.post<Email>("/emails/send", data),

  bulkSend: (data: {
    influencerIds: string[];
    templateId: string;
    variables?: Record<string, string>;
    startAutomation?: boolean;
    automationTemplates?: string[];
    provider?: "gmail" | "mailgun";
  }) => apiClient.post<BulkOperationResult>("/emails/bulk-send", data),
};

/** Queue API */
export const queueApi = {
  health: () => apiClient.get<QueueHealthResponse>("/queue/health"),

  stats: () => apiClient.get<QueueStatsResponse>("/queue/stats"),

  metrics: () =>
    apiClient.get<{ success: boolean; data: QueueMetricsData }>(
      "/queue/metrics"
    ),

  config: () =>
    apiClient.get<{ success: boolean; data: QueueConfigData }>("/queue/config"),

  cleanup: () => apiClient.post("/queue/cleanup"),
};

/** Dashboard API */
export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>("/dashboard/stats"),

  getPipeline: () =>
    apiClient.get<Array<{ status: InfluencerStatus; count: number }>>(
      "/dashboard/pipeline"
    ),

  getActivity: (params?: { limit?: number }) =>
    apiClient.get("/dashboard/activity", { params }),
};
