export type AccountType = "Client" | "Channel Partner";
export type AccountStatus = "Active" | "Inactive";
export type OpportunityStatus = 'Scope Of Work' | 'Proposal' | 'Negotiation' | 'Win' | 'Loss' | 'On Hold';
export type UpdateType = "General" | "Call" | "Meeting" | "Email";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Converted to Account" | "Lost" | "Rejected";

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
  linkedinProfileUrl?: string;
  country?: string;
  status: LeadStatus;
  opportunityIds: string[]; // Opportunities that might be associated before conversion
  updateIds?: string[]; // Direct updates to this lead
  createdAt: string;
  updatedAt: string;
  assignedUserId?: string; // NEW: user assignment
  rejectionReasons?: string[]; // Reasons why the lead was rejected
  website?: string;
  industry?: string;
  jobTitle?: string;
}

export interface Opportunity {
  id: string;
  name: string;
  accountId?: string; // Opportunities can be linked to Accounts
  leadId?: string;    // Or to Leads
  status: OpportunityStatus;
  value: number;
  description: string;
  updateIds: string[];
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate: string;
  currency?: string;
  ownerId?: string;
}

export interface Update {
  id: string;
  opportunityId?: string; // Optional: if update is for an opportunity
  leadId?: string;        // Optional: if update is directly for a lead
  accountId?: string;     // Optional: context if opportunityId is present
  date: string;
  content: string;
  type: UpdateType;
  createdAt: string;
  updatedByUserId?: string;
  nextActionDate?: string; // Optional: next action date for follow-up
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
  role: string;
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
