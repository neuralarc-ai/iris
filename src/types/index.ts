
export type AccountType = "Client" | "Channel Partner";
export type AccountStatus = "Active" | "Inactive";
export type OpportunityStatus = "Need Analysis" | "Negotiation" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type UpdateType = "General" | "Call" | "Meeting" | "Email";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Converted to Account" | "Lost";

export interface Account {
  id: string;
  name: string; // Company Name for the account
  type: AccountType;
  status: AccountStatus;
  description: string;
  opportunityIds: string[];
  createdAt: string;
  updatedAt: string;
  contactEmail?: string;
  industry?: string;
  contactPersonName?: string; // Added from lead conversion
  contactPhone?: string; // Added from lead conversion
  convertedFromLeadId?: string; // Track original lead
}

export interface Lead {
  id: string;
  companyName: string;
  personName: string;
  phone?: string;
  email: string;
  linkedinProfileUrl?: string; // New field
  country?: string; // New field
  status: LeadStatus;
  opportunityIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  name:string;
  accountId: string; // Opportunities are linked to Accounts
  status: OpportunityStatus;
  value: number;
  description: string;
  updateIds: string[];
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
}

export interface Update {
  id: string;
  opportunityId: string;
  date: string;
  content: string;
  type: UpdateType;
  createdAt: string;
}

// For AI Generated Content
export interface DailyAccountSummary {
  summary: string;
  relationshipHealth: string;
}

export interface OpportunityForecast {
  timelinePrediction: string;
  completionDateEstimate: string;
  revenueForecast: number;
  bottleneckIdentification: string;
}

export interface UpdateInsights {
  categorization?: string;
  summary?: string;
  actionItems?: string[];
  followUpSuggestions?: string[];
  sentiment?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  createdAt: string;
}

export interface ApiSettings {
  deepSeekApiKey?: string;
  deepSeekModel?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

// For Business Card OCR
export interface ExtractedLeadInfo {
    personName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
}
