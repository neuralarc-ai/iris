
import type { Account, Project, Update, User, Lead, LeadStatus } from '@/types';
import { DEMO_PIN } from '@/lib/constants';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const oneWeekAgo = new Date(today);
oneWeekAgo.setDate(today.getDate() - 7);
const oneMonthAgo = new Date(today);
oneMonthAgo.setMonth(today.getMonth() - 1);


export const mockLeads: Lead[] = [
  {
    id: 'lead_001',
    companyName: 'Future Gadgets Co.',
    personName: 'Rintaro Okabe',
    email: 'okabe@futuregadgets.com',
    phone: '555-0100',
    status: 'Qualified',
    projectIds: ['proj_lead_001'],
    createdAt: oneWeekAgo.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: 'lead_002',
    companyName: 'Cyberdyne Systems',
    personName: 'Miles Dyson',
    email: 'mdyson@cyberdyne.com',
    phone: '555-0200',
    status: 'Proposal Sent',
    projectIds: [],
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'lead_003',
    companyName: 'Stark Industries',
    personName: 'Pepper Potts',
    email: 'ppotts@stark.com',
    status: 'New',
    projectIds: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  }
];

export const mockAccounts: Account[] = [
  {
    id: 'acc_001',
    name: 'Innovatech Solutions',
    type: 'Client',
    status: 'Active',
    description: 'Leading provider of cloud-based AI solutions. Key focus on enterprise software.',
    projectIds: ['proj_001', 'proj_002'],
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: yesterday.toISOString(),
    contactEmail: 'contact@innovatech.com',
    industry: 'Technology',
  },
  {
    id: 'acc_002',
    name: 'Synergy Partners Inc.',
    type: 'Channel Partner',
    status: 'Active',
    description: 'Strategic partner for market expansion in the APAC region. Strong reseller network.',
    projectIds: ['proj_003'],
    createdAt: new Date(new Date().setDate(today.getDate() - 60)).toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
    contactEmail: 'partner@synergy.com',
    industry: 'Consulting',
  },
  {
    id: 'acc_003',
    name: 'Global Corp Ltd.',
    type: 'Client',
    status: 'Inactive',
    description: 'Large multinational corporation. Previous engagement completed, exploring new opportunities.',
    projectIds: [],
    createdAt: new Date(new Date().setDate(today.getDate() - 120)).toISOString(),
    updatedAt: new Date(new Date().setDate(today.getDate() - 30)).toISOString(),
    contactEmail: 'info@globalcorp.com',
    industry: 'Manufacturing',
  },
];

export const mockProjects: Project[] = [
  {
    id: 'proj_001',
    name: 'Project Phoenix',
    accountId: 'acc_001',
    status: 'In Progress',
    value: 150000,
    startDate: oneMonthAgo.toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 2)).toISOString(),
    description: 'Development of a new AI-driven analytics platform for Innovatech.',
    updateIds: ['upd_001', 'upd_002'],
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: 'proj_002',
    name: 'AI Integration Initiative',
    accountId: 'acc_001',
    status: 'Need Analysis',
    value: 75000,
    startDate: new Date(new Date().setDate(today.getDate() + 7)).toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 1)).toISOString(),
    description: 'Exploring integration of Iris AI capabilities into Innovatech\'s existing CRM.',
    updateIds: [],
    createdAt: oneWeekAgo.toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'proj_003',
    name: 'APAC Market Entry',
    accountId: 'acc_002',
    status: 'Negotiation',
    value: 250000,
    startDate: new Date(new Date().setDate(today.getDate() + 14)).toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 6)).toISOString(),
    description: 'Partnership with Synergy Partners for launching services in the Asia-Pacific market.',
    updateIds: ['upd_003'],
    createdAt: new Date(new Date().setDate(today.getDate() - 10)).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_lead_001', // Project linked to a lead
    name: 'Time Leap Machine Feasibility',
    leadId: 'lead_001', // Linked to Rintaro Okabe at Future Gadgets Co.
    status: 'Need Analysis',
    value: 50000, // Quoted amount
    startDate: today.toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 1)).toISOString(),
    description: 'Initial feasibility study for a temporal displacement device.',
    updateIds: ['upd_lead_001'],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
];

export const mockUpdates: Update[] = [
  {
    id: 'upd_001',
    projectId: 'proj_001',
    date: yesterday.toISOString(),
    content: 'Weekly sync call with Innovatech team. Discussed progress on module A and upcoming sprint planning. Client expressed satisfaction with current trajectory.',
    type: 'Call',
    createdAt: yesterday.toISOString(),
  },
  {
    id: 'upd_002',
    projectId: 'proj_001',
    date: oneWeekAgo.toISOString(),
    content: 'Initial prototype for analytics dashboard shared with Innovatech. Positive feedback received, minor UI adjustments requested.',
    type: 'General',
    createdAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'upd_003',
    projectId: 'proj_003',
    date: new Date().toISOString(),
    content: 'Received revised proposal from Synergy Partners. Legal team is reviewing the terms. Follow-up meeting scheduled for next week.',
    type: 'Email',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'upd_lead_001',
    projectId: 'proj_lead_001',
    date: yesterday.toISOString(),
    content: 'Met with Okabe-san. He seems very enthusiastic but some of his ideas are... unconventional. Requested a preliminary budget.',
    type: 'Meeting',
    createdAt: yesterday.toISOString(),
  }
];

export let mockUsers: User[] = [
  {
    id: 'user_admin_000',
    name: 'Admin User',
    email: 'admin@iris.ai',
    pin: DEMO_PIN,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_jane_001',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    pin: '654321',
    createdAt: oneWeekAgo.toISOString(),
  },
];

export const addUser = (name: string, email: string, pin: string): User => {
  const newUser: User = {
    id: `user_${new Date().getTime()}`,
    name,
    email,
    pin, 
    createdAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  return newUser;
};

export const addAccount = (accountData: Omit<Account, 'id' | 'projectIds' | 'createdAt' | 'updatedAt'>): Account => {
  const newAccount: Account = {
    id: `acc_${new Date().getTime()}`,
    ...accountData,
    projectIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAccounts.push(newAccount);
  return newAccount;
};

export const addLead = (leadData: Omit<Lead, 'id' | 'projectIds' | 'createdAt' | 'updatedAt' | 'status'>): Lead => {
  const newLead: Lead = {
    id: `lead_${new Date().getTime()}`,
    ...leadData,
    status: 'New' as LeadStatus,
    projectIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockLeads.push(newLead);
  return newLead;
};


export const updateUserPin = (userId: string, newPin: string): boolean => {
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex > -1) {
    mockUsers[userIndex].pin = newPin;
    return true;
  }
  return false;
};

export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find(user => user.id === userId);
};

export const getProjectsForAccount = (accountId: string): Project[] => {
  return mockProjects.filter(p => p.accountId === accountId);
};

export const getProjectsForLead = (leadId: string): Project[] => {
  return mockProjects.filter(p => p.leadId === leadId);
};

export const getUpdatesForProject = (projectId: string): Update[] => {
  return mockUpdates.filter(u => u.projectId === projectId);
};

export const getLeadById = (leadId: string): Lead | undefined => {
  return mockLeads.find(lead => lead.id === leadId);
}

export const getAccountById = (accountId: string): Account | undefined => {
  return mockAccounts.find(account => account.id === accountId);
}
