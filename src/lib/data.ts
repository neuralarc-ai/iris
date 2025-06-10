
import type { Account, Opportunity, Update, User, Lead, LeadStatus, OpportunityStatus, AccountType } from '@/types';
import { DEMO_PIN } from '@/lib/constants';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const oneWeekAgo = new Date(today);
oneWeekAgo.setDate(today.getDate() - 7);
const oneMonthAgo = new Date(today);
oneMonthAgo.setMonth(today.getMonth() - 1);


export let mockLeads: Lead[] = [ // Made 'let' for modification
  {
    id: 'lead_001',
    companyName: 'Future Gadgets Co.',
    personName: 'Rintaro Okabe',
    email: 'okabe@futuregadgets.com',
    phone: '555-0100',
    status: 'Qualified',
    // opportunityIds: ['opp_lead_001'], // Opportunities will be on Account
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
    // opportunityIds: [],
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'lead_003',
    companyName: 'Stark Industries',
    personName: 'Pepper Potts',
    email: 'ppotts@stark.com',
    status: 'New',
    // opportunityIds: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  }
];

export let mockAccounts: Account[] = [ // Made 'let' for modification
  {
    id: 'acc_001',
    name: 'Innovatech Solutions',
    type: 'Client',
    status: 'Active',
    description: 'Leading provider of cloud-based AI solutions. Key focus on enterprise software.',
    opportunityIds: ['opp_001', 'opp_002'],
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
    opportunityIds: ['opp_003'],
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
    opportunityIds: [],
    createdAt: new Date(new Date().setDate(today.getDate() - 120)).toISOString(),
    updatedAt: new Date(new Date().setDate(today.getDate() - 30)).toISOString(),
    contactEmail: 'info@globalcorp.com',
    industry: 'Manufacturing',
  },
];

export let mockOpportunities: Opportunity[] = [ // Made 'let' for modification
  {
    id: 'opp_001',
    name: 'Opportunity Phoenix',
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
    id: 'opp_002',
    name: 'AI Integration Initiative',
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
    id: 'opp_003',
    name: 'APAC Market Entry',
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
  // Example: opp_lead_001 is now associated with an account that lead_001 would convert to.
  // Let's assume lead_001 converts to an account like 'Future Gadgets Solutions'
  // We'll create this account during conversion. For now, removing direct opportunity-to-lead mock data.
];

export const mockUpdates: Update[] = [
  {
    id: 'upd_001',
    opportunityId: 'opp_001',
    date: yesterday.toISOString(),
    content: 'Weekly sync call with Innovatech team. Discussed progress on module A and upcoming sprint planning. Client expressed satisfaction with current trajectory.',
    type: 'Call',
    createdAt: yesterday.toISOString(),
  },
  {
    id: 'upd_002',
    opportunityId: 'opp_001',
    date: oneWeekAgo.toISOString(),
    content: 'Initial prototype for analytics dashboard shared with Innovatech. Positive feedback received, minor UI adjustments requested.',
    type: 'General',
    createdAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'upd_003',
    opportunityId: 'opp_003',
    date: new Date().toISOString(),
    content: 'Received revised proposal from Synergy Partners. Legal team is reviewing the terms. Follow-up meeting scheduled for next week.',
    type: 'Email',
    createdAt: new Date().toISOString(),
  },
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

export const addAccount = (accountData: Omit<Account, 'id' | 'opportunityIds' | 'createdAt' | 'updatedAt' | 'status' | 'type'> & { type: AccountType, status?: AccountStatus }): Account => {
  const newAccount: Account = {
    id: `acc_${new Date().getTime()}`,
    name: accountData.name,
    type: accountData.type,
    status: accountData.status || 'Active',
    description: accountData.description,
    contactEmail: accountData.contactEmail,
    industry: accountData.industry,
    contactPersonName: accountData.contactPersonName,
    contactPhone: accountData.contactPhone,
    convertedFromLeadId: accountData.convertedFromLeadId,
    opportunityIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAccounts.push(newAccount);
  return newAccount;
};

export const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status' >): Lead => {
  const newLead: Lead = {
    id: `lead_${new Date().getTime()}`,
    ...leadData,
    status: 'New' as LeadStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockLeads.push(newLead);
  return newLead;
};

export const convertLeadToAccount = (leadId: string): Account | null => {
  const leadIndex = mockLeads.findIndex(l => l.id === leadId);
  if (leadIndex === -1) return null;

  const lead = mockLeads[leadIndex];
  if (lead.status === "Converted to Account" || lead.status === "Lost") return null; // Cannot convert already converted/lost lead

  const newAccount = addAccount({
    name: lead.companyName,
    type: 'Client' as AccountType, // Default to Client
    status: 'Active' as AccountStatus,
    description: `Account converted from lead: ${lead.personName} - ${lead.companyName}`,
    contactPersonName: lead.personName,
    contactEmail: lead.email,
    contactPhone: lead.phone,
    convertedFromLeadId: lead.id,
    // industry: undefined, // Can be added later or during a more detailed conversion step
  });

  // Update lead status
  mockLeads[leadIndex].status = "Converted to Account";
  mockLeads[leadIndex].updatedAt = new Date().toISOString();
  
  // Potentially transfer any "pre-opportunities" if that logic existed
  // For now, opportunities are created against accounts.

  return newAccount;
};


export const addOpportunity = (opportunityData: Omit<Opportunity, 'id' | 'updateIds' | 'createdAt' | 'updatedAt' | 'status' | 'startDate' | 'endDate'> & { accountId: string }): Opportunity => {
  const newOpportunity: Opportunity = {
    id: `opp_${new Date().getTime()}`,
    name: opportunityData.name,
    accountId: opportunityData.accountId, // Must be linked to an account
    description: opportunityData.description,
    value: opportunityData.value,
    status: 'Need Analysis' as OpportunityStatus,
    updateIds: [],
    startDate: today.toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 1)).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockOpportunities.push(newOpportunity);
  
  const account = mockAccounts.find(a => a.id === newOpportunity.accountId);
  if (account) {
    account.opportunityIds.push(newOpportunity.id);
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

export const getOpportunitiesByAccount = (accountId: string): Opportunity[] => {
  return mockOpportunities.filter(o => o.accountId === accountId);
};

// No longer needed as opportunities are directly on accounts for this primary flow
// export const getOpportunitiesByLead = (leadId: string): Opportunity[] => {
//   return mockOpportunities.filter(o => o.leadId === leadId);
// };

export const getUpdatesForOpportunity = (opportunityId: string): Update[] => {
  return mockUpdates.filter(u => u.opportunityId === opportunityId);
};

export const getLeadById = (leadId: string): Lead | undefined => {
  return mockLeads.find(lead => lead.id === leadId);
}

export const getAccountById = (accountId: string): Account | undefined => {
  return mockAccounts.find(account => account.id === accountId);
}

export const getOpportunityById = (opportunityId: string): Opportunity | undefined => {
    return mockOpportunities.find(opp => opp.id === opportunityId);
}

// Helper to get all unconverted leads
export const getUnconvertedLeads = (): Lead[] => {
  return mockLeads.filter(lead => lead.status !== 'Converted to Account' && lead.status !== 'Lost');
};
