
import type { Account, Opportunity, Update, User, Lead, LeadStatus, OpportunityStatus } from '@/types'; // Renamed Project to Opportunity
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
    opportunityIds: ['opp_lead_001'], // Renamed
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
    opportunityIds: [], // Renamed
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'lead_003',
    companyName: 'Stark Industries',
    personName: 'Pepper Potts',
    email: 'ppotts@stark.com',
    status: 'New',
    opportunityIds: [], // Renamed
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
    opportunityIds: ['opp_001', 'opp_002'], // Renamed
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
    opportunityIds: ['opp_003'], // Renamed
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
    opportunityIds: [], // Renamed
    createdAt: new Date(new Date().setDate(today.getDate() - 120)).toISOString(),
    updatedAt: new Date(new Date().setDate(today.getDate() - 30)).toISOString(),
    contactEmail: 'info@globalcorp.com',
    industry: 'Manufacturing',
  },
];

export const mockOpportunities: Opportunity[] = [ // Renamed
  {
    id: 'opp_001', // Renamed
    name: 'Opportunity Phoenix', // Renamed
    accountId: 'acc_001',
    status: 'In Progress' as OpportunityStatus,
    value: 150000,
    startDate: oneMonthAgo.toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 2)).toISOString(),
    description: 'Development of a new AI-driven analytics platform for Innovatech.',
    updateIds: ['upd_001', 'upd_002'],
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: 'opp_002', // Renamed
    name: 'AI Integration Initiative', // Renamed
    accountId: 'acc_001',
    status: 'Need Analysis' as OpportunityStatus,
    value: 75000,
    startDate: new Date(new Date().setDate(today.getDate() + 7)).toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 1)).toISOString(),
    description: 'Exploring integration of Iris AI capabilities into Innovatech\'s existing CRM.',
    updateIds: [],
    createdAt: oneWeekAgo.toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'opp_003', // Renamed
    name: 'APAC Market Entry', // Renamed
    accountId: 'acc_002',
    status: 'Negotiation' as OpportunityStatus,
    value: 250000,
    startDate: new Date(new Date().setDate(today.getDate() + 14)).toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 6)).toISOString(),
    description: 'Partnership with Synergy Partners for launching services in the Asia-Pacific market.',
    updateIds: ['upd_003'],
    createdAt: new Date(new Date().setDate(today.getDate() - 10)).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'opp_lead_001', // Renamed
    name: 'Time Leap Machine Feasibility', // Renamed
    leadId: 'lead_001', 
    status: 'Need Analysis' as OpportunityStatus,
    value: 50000, 
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
    opportunityId: 'opp_001', // Renamed
    date: yesterday.toISOString(),
    content: 'Weekly sync call with Innovatech team. Discussed progress on module A and upcoming sprint planning. Client expressed satisfaction with current trajectory.',
    type: 'Call',
    createdAt: yesterday.toISOString(),
  },
  {
    id: 'upd_002',
    opportunityId: 'opp_001', // Renamed
    date: oneWeekAgo.toISOString(),
    content: 'Initial prototype for analytics dashboard shared with Innovatech. Positive feedback received, minor UI adjustments requested.',
    type: 'General',
    createdAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'upd_003',
    opportunityId: 'opp_003', // Renamed
    date: new Date().toISOString(),
    content: 'Received revised proposal from Synergy Partners. Legal team is reviewing the terms. Follow-up meeting scheduled for next week.',
    type: 'Email',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'upd_lead_001',
    opportunityId: 'opp_lead_001', // Renamed
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
    pin: '654321', // This PIN is static as per previous behavior
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

export const addAccount = (accountData: Omit<Account, 'id' | 'opportunityIds' | 'createdAt' | 'updatedAt'>): Account => { // Renamed
  const newAccount: Account = {
    id: `acc_${new Date().getTime()}`,
    ...accountData,
    opportunityIds: [], // Renamed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAccounts.push(newAccount);
  return newAccount;
};

export const addLead = (leadData: Omit<Lead, 'id' | 'opportunityIds' | 'createdAt' | 'updatedAt' | 'status'>): Lead => { // Renamed
  const newLead: Lead = {
    id: `lead_${new Date().getTime()}`,
    ...leadData,
    status: 'New' as LeadStatus,
    opportunityIds: [], // Renamed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockLeads.push(newLead);
  return newLead;
};

// Function to add an opportunity (newly added based on user request)
export const addOpportunity = (opportunityData: Omit<Opportunity, 'id' | 'updateIds' | 'createdAt' | 'updatedAt' | 'status' | 'startDate' | 'endDate'> & {leadId?: string, accountId?: string}): Opportunity => {
  const newOpportunity: Opportunity = {
    id: `opp_${new Date().getTime()}`,
    name: opportunityData.name,
    description: opportunityData.description,
    value: opportunityData.value,
    leadId: opportunityData.leadId,
    accountId: opportunityData.accountId,
    status: 'Need Analysis' as OpportunityStatus, // Default status
    updateIds: [],
    // For simplicity, using today and a month from now for new opportunities
    startDate: today.toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 1)).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockOpportunities.push(newOpportunity);
  // Link opportunity to lead if leadId is provided
  if (newOpportunity.leadId) {
    const lead = mockLeads.find(l => l.id === newOpportunity.leadId);
    if (lead) {
      lead.opportunityIds.push(newOpportunity.id);
    }
  }
  // Link opportunity to account if accountId is provided (though current flow is lead first)
  if (newOpportunity.accountId) {
     const account = mockAccounts.find(a => a.id === newOpportunity.accountId);
    if (account) {
      account.opportunityIds.push(newOpportunity.id);
    }
  }
  return newOpportunity;
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

export const getOpportunitiesByAccount = (accountId: string): Opportunity[] => { // Renamed
  return mockOpportunities.filter(o => o.accountId === accountId); // Renamed
};

export const getOpportunitiesByLead = (leadId: string): Opportunity[] => { // Renamed
  return mockOpportunities.filter(o => o.leadId === leadId); // Renamed
};

export const getUpdatesForOpportunity = (opportunityId: string): Update[] => { // Renamed
  return mockUpdates.filter(u => u.opportunityId === opportunityId); // Renamed
};

export const getLeadById = (leadId: string): Lead | undefined => {
  return mockLeads.find(lead => lead.id === leadId);
}

export const getAccountById = (accountId: string): Account | undefined => {
  return mockAccounts.find(account => account.id === accountId);
}

export const getOpportunityById = (opportunityId: string): Opportunity | undefined => { // New helper
    return mockOpportunities.find(opp => opp.id === opportunityId);
}
