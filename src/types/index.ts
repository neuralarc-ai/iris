export type AccountType = "Client" | "Channel Partner";
export type AccountStatus = "Active" | "Inactive";
export type ProjectStatus = "Need Analysis" | "Negotiation" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type UpdateType = "General" | "Call" | "Meeting" | "Email";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  description: string;
  projectIds: string[]; // Store IDs of associated projects
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Project {
  id: string;
  name:string;
  accountId: string; // ID of the associated account
  status: ProjectStatus;
  value: number; // Monetary value
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  description: string;
  updateIds: string[]; // Store IDs of associated updates
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Update {
  id: string;
  projectId: string; // ID of the associated project
  date: string; // ISO date string
  content: string;
  type: UpdateType;
  createdAt: string; // ISO date string
}

export interface ApiSettings {
  deepSeekApiKey?: string;
  deepSeekModel?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

// For AI Generated Content
export interface DailyAccountSummary {
  summary: string;
  relationshipHealth: string; // e.g., "Healthy", "At Risk", "Needs Attention"
}

export interface ProjectForecast {
  timelinePrediction: string;
  completionDateEstimate: string; // ISO date string or textual description
  revenueForecast: number;
  bottleneckIdentification: string;
}

export interface UpdateInsights {
  categorization?: string; // AI-powered category
  summary?: string;
  actionItems?: string[];
  followUpSuggestions?: string[];
  sentiment?: string; // e.g., "Positive", "Neutral", "Negative"
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string; // 6-digit PIN
  createdAt: string; // ISO date string
}
