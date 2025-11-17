// lib/shared-types.ts - Single source of truth for enums
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
}

export enum InfluencerStatus {
  NOT_SENT = "NOT_SENT",
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
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  SENT = "SENT",
  FAILED = "FAILED",
  OPENED = "OPENED",
  REPLIED = "REPLIED",
}

// Utility functions for enum validation
export const isValidEmailStatus = (status: string): status is EmailStatus => {
  return Object.values(EmailStatus).includes(status as EmailStatus);
};

export const getSafeEmailStatus = (status: string): EmailStatus => {
  return isValidEmailStatus(status) ? status : EmailStatus.PENDING;
};
