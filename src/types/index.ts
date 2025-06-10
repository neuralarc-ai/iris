
export type AccountType = "Client" | "Channel Partner";
export type AccountStatus = "Active" | "Inactive";
export type OpportunityStatus = "Need Analysis" | "Negotiation" | "In Progress" | "On Hold" | "Completed" | "Cancelled"; // Renamed
export type UpdateType = "General" | "Call" | "Meeting" | "Email";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Converted to Account" | "Lost";

export interface Account {
  id: string;
  name: string; // Company Name for the account
  type: AccountType;
  status: AccountStatus;
  description: string;
  opportunityIds: string[]; // Renamed
  createdAt: string; 
  updatedAt: string; 
  contactEmail?: string; 
  industry?: string;
  // If converted from a lead, these might be populated
  contactPersonName?: string;
  contactPhone?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  personName: string;
  phone?: string;
  email: string;
  status: LeadStatus;
  opportunityIds: string[]; // Renamed
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity { // Renamed
  id: string;
  name:string;
  accountId?: string; 
  leadId?: string; 
  status: OpportunityStatus; // Renamed
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
  opportunityId: string; // Renamed
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

export interface OpportunityForecast { // Renamed
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
