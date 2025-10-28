export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
}

export enum InfluencerStatus {
  PING_1 = "PING_1",
  PING_2 = "PING_2",
  PING_3 = "PING_3",
  CONTRACT = "CONTRACT",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export enum ContractStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  SIGNED = "SIGNED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum EmailStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  OPENED = "OPENED",
  REPLIED = "REPLIED",
}

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
  followers?: number;
  engagementRate?: number;
  niche?: string;
  country?: string;
  status: InfluencerStatus;
  notes?: string;
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
  contracts?: Contract[];
  emails?: Email[];
  _count?: {
    emails: number;
  };
}

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
  createdAt: string;
  updatedAt: string;
  influencer?: Influencer;
  campaign?: Campaign;
}

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
    index: number;
    error: string;
  }>;
}

export interface ImportInfluencerData {
  name: string;
  email?: string;
  instagramHandle?: string;
  followers?: number;
  engagementRate?: number;
  niche?: string;
  country?: string;
  notes?: string;
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
}

export interface BulkSendEmailData {
  influencerIds: string[];
  templateId: string;
  variables?: Record<string, string>;
}

export interface DuplicateInfluencer {
  id: string;
  name: string;
  email?: string;
  instagramHandle?: string;
  status: InfluencerStatus;
}

// Fix the InfluencerFormData interface to handle both string (form) and number (API) types
export interface InfluencerFormData {
  name: string;
  email: string;
  instagramHandle: string;
  followers: string;
  engagementRate: string;
  niche: string;
  country: string;
  status: InfluencerStatus;
  notes: string;
  lastContactDate?: string;
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
  engagementRate: string;
  niche: string;
  country: string;
  status: InfluencerStatus;
  notes: string;
  lastContactDate?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicate?: DuplicateInfluencer;
}

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
