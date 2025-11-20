import {
  ContractStatus,
  EmailStatus,
  InfluencerStatus,
  UserRole,
} from "@/lib/shared-types";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasGoogleAuth: boolean;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleEmail?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Influencer {
  id: string;
  name: string;
  email?: string;
  instagramHandle?: string;
  nickname?: string;
  link?: string;
  contactMethod?: string;
  paymentMethod?: string;
  managerComment?: string;
  statistics?: string;
  storyViews?: string;
  averageViews?: string;
  engagementCount?: string;
  priceEUR?: number;
  priceUSD?: number;
  followers?: number;
  managerId?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  country?: string;
  status: InfluencerStatus;
  notes?: string;
  lastContactDate?: string;

  // Enhanced automation fields
  automationStatus?: string;
  nextAutomationAt?: string;

  createdAt: string;
  updatedAt: string;
  contracts?: Contract[];
  emails?: Email[];
  _count?: {
    emails: number;
  };
}

// Contract types
export interface Contract {
  id: string;
  influencerId: string;
  campaignId?: string;
  status: ContractStatus;
  amount?: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  deliverables?: string;
  terms?: string;
  signedAt?: string;
  contractFileUrl?: string;
  nickname?: string;
  link?: string;
  contactMethod?: string;
  paymentMethod?: string;
  managerComment?: string;
  statistics?: string;
  storyViews?: string;
  averageViews?: string;
  engagementCount?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  influencer?: Influencer;
  campaign?: Campaign;
}

export interface CreateContractData {
  influencerId: string;
  campaignId?: string;
  amount?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  deliverables?: string;
  terms?: string;
  nickname?: string;
  link?: string;
  contactMethod?: string;
  paymentMethod?: string;
  managerComment?: string;
  statistics?: string;
  storyViews?: string;
  averageViews?: string;
  engagementCount?: string;
}

export interface UpdateContractData {
  status?: ContractStatus;
  amount?: number;
  currency?: string;
  startDate?: string;
  link?: string;
  endDate?: string;
  deliverables?: string;
  terms?: string;
  contractFileUrl?: string;
  nickname?: string;
  contactMethod?: string;
  paymentMethod?: string;
  managerComment?: string;
  statistics?: string;
  storyViews?: string;
  averageViews?: string;
  engagementCount?: string;
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  contracts?: Contract[];
  _count?: {
    contracts: number;
    influencers: number;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: string;
  influencerId: string;
  templateId?: string;
  sentById: string;
  subject: string;
  body: string;
  status: EmailStatus;
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  errorMessage?: string;
  isAutomation?: boolean;
  automationStepId?: string;
  createdAt: string;
  updatedAt: string;
  influencer?: Influencer;
  template?: EmailTemplate;
  sentBy?: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentPage?: number;
  totalCount?: number;
}

export interface DashboardStats {
  totalInfluencers: number;
  activeContracts: number;
  emailsSentToday: number;
  pipelineStats: {
    ping1: number;
    ping2: number;
    ping3: number;
    contract: number;
  };
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    influencerId: string;
    error: string;
  }>;
  queued?: string[];
  message?: string;
}

// Campaign Form Data
export interface CreateCampaignData {
  name: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  isActive?: boolean;
}

// Email Template Form Data
export interface CreateEmailTemplateData {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
  isActive?: boolean;
}

export type UpdateEmailTemplateData = Partial<CreateEmailTemplateData>;

// Email Send Data
export interface SendEmailData {
  influencerId: string;
  templateId?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, string>;
  provider?: "gmail" | "mailgun";
}

export interface BulkSendEmailData {
  influencerIds: string[];
  templateId: string;
  variables?: Record<string, string>;
  startAutomation?: boolean;
  automationTemplates?: string[];
  provider?: "gmail" | "mailgun";
}

export interface DuplicateInfluencer {
  id: string;
  name: string;
  email?: string;
  instagramHandle?: string;
  status: InfluencerStatus;
}

// Create a separate interface for API submission
export interface InfluencerCreateData {
  name: string;
  email?: string;
  instagramHandle?: string;
  followers?: number;
  engagementRate?: number;
  niche?: string;
  country?: string;
  status: InfluencerStatus;
  notes?: string;
  lastContactDate?: string;
}

export interface DuplicateDialogState {
  open: boolean;
  duplicate: DuplicateInfluencer | null;
  type: "email" | "instagram" | "both";
}

export interface InfluencerFormData {
  name: string;
  email: string;
  instagramHandle: string;
  followers: string;
  country: string;
  status: InfluencerStatus;
  notes: string;
  lastContactDate?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicate?: DuplicateInfluencer;
}

export type ImportJob = {
  id: string;
  managerId: string;
  filename: string;
  filePath?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalRows?: number;
  successCount?: number;
  failedCount?: number;
  duplicates?: unknown;
  errors?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export interface ImportInfluencerData {
  // optional because import rows can be partial and backend does parse/validate
  name?: string | null;
  email?: string | null;
  instagramHandle?: string | null;
  link?: string | null;
  followers?: number | null;
  country?: string | null;
  notes?: string | null;
  status?: InfluencerStatus | string | null;
}

export type ExportJob = {
  id: string;
  managerId: string;
  filters?: unknown;
  filePath?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalRows?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ImportProgressEvent = {
  jobId: string;
  processed?: number;
  success?: number;
  failed?: number;
  duplicatesCount?: number;
  done?: boolean;
  error?: string;
};

export type ExportProgressEvent = {
  jobId: string;
  processed?: number;
  total?: number;
  percent?: number | null;
  done?: boolean;
  downloadReady?: boolean;
  error?: string;
};

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      duplicate?: DuplicateInfluencer;
    };
  };
  message?: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  email: string;
  expiresIn?: number;
}

export interface ApiDuplicateInfluencer {
  id: string;
  name: string;
  email?: string;
  instagramHandle?: string;
  status: string;
}

export interface EmailConfig {
  isValid: boolean;
  message: string;
  hasTokens: boolean;
  gmailAddress?: string;
  userName?: string;
}
