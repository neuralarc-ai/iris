
export type AccountType = "Client" | "Channel Partner";
export type AccountStatus = "Active" | "Inactive";
export type ProjectStatus = "Need Analysis" | "Negotiation" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type UpdateType = "General" | "Call" | "Meeting" | "Email";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Converted to Account" | "Lost";

export interface Account {
  id: string;
  name: string; // Company Name for the account
  type: AccountType;
  status: AccountStatus;
  description: string;
  projectIds: string[];
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
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name:string;
  accountId?: string; // ID of the associated account (if converted/direct account project)
  leadId?: string; // ID of the associated lead (if project created for a lead)
  status: ProjectStatus;
  value: number; // Monetary value / Quoted amount
  description: string;
  updateIds: string[]; 
  createdAt: string; 
  updatedAt: string; 
  // startDate and endDate were on ProjectCard but not in type, adding them
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface Update {
  id: string;
  projectId: string; 
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

export interface ProjectForecast {
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
