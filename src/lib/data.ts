
import type { Account, Opportunity, Update, User, Lead, LeadStatus, OpportunityStatus, AccountType, UpdateType } from '@/types';
import { DEMO_PIN } from '@/lib/constants';
import { countries } from '@/lib/countryData'; // Import countries

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
    opportunityIds: [],
    updateIds: ['upd_lead_001'],
    linkedinProfileUrl: 'https://linkedin.com/in/rintarookabe',
    country: 'Japan',
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
    opportunityIds: [],
    country: 'United States',
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'lead_003',
    companyName: 'Stark Industries',
    personName: 'Pepper Potts',
    email: 'ppotts@stark.com',
    status: 'New',
    opportunityIds: [],
    linkedinProfileUrl: 'https://linkedin.com/in/pepperpotts',
    country: 'United States',
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
    updateIds: ['upd_001', 'upd_002', 'upd_005'],
    createdAt: oneMonthAgo.toISOString(),
    updatedAt: new Date(new Date().setDate(today.getDate() - 3)).toISOString(),
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
    updateIds: ['upd_004'],
    createdAt: oneWeekAgo.toISOString(),
    updatedAt: new Date(new Date().setDate(today.getDate() - 2)).toISOString(),
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
];

export let mockUpdates: Update[] = [ // Made 'let' for modification
  {
    id: 'upd_001',
    opportunityId: 'opp_001',
    accountId: 'acc_001',
    date: yesterday.toISOString(),
    content: 'Weekly sync call with Innovatech team. Discussed progress on module A and upcoming sprint planning. Client expressed satisfaction with current trajectory. Identified a minor scope creep regarding reporting features which needs to be addressed next week. Overall positive sentiment, relationship health is strong.',
    type: 'Call',
    createdAt: yesterday.toISOString(),
    updatedByUserId: 'user_admin_000',
  },
  {
    id: 'upd_002',
    opportunityId: 'opp_001',
    accountId: 'acc_001',
    date: oneWeekAgo.toISOString(),
    content: 'Initial prototype for analytics dashboard shared with Innovatech. Positive feedback received, minor UI adjustments requested. Client team is excited about the potential. Action items: Schedule follow-up for UI changes, prepare detailed UAT plan.',
    type: 'General',
    createdAt: oneWeekAgo.toISOString(),
    updatedByUserId: 'user_jane_001',
  },
  {
    id: 'upd_003',
    opportunityId: 'opp_003',
    accountId: 'acc_002',
    date: new Date().toISOString(),
    content: 'Received revised proposal from Synergy Partners. Legal team is reviewing the terms. Follow-up meeting scheduled for next week to discuss final points. Relationship health seems okay, but there are some tough negotiation points ahead.',
    type: 'Email',
    createdAt: new Date().toISOString(),
    updatedByUserId: 'user_admin_000',
  },
  {
    id: 'upd_004',
    opportunityId: 'opp_002',
    accountId: 'acc_001',
    date: new Date(new Date().setDate(today.getDate() - 2)).toISOString(),
    content: 'Conducted detailed needs analysis workshop with Innovatech stakeholders for the AI Integration Initiative. Gathered key requirements and user stories. Next step is to consolidate findings and present a preliminary scope document. Client is keen to move fast.',
    type: 'Meeting',
    createdAt: new Date(new Date().setDate(today.getDate() - 2)).toISOString(),
    updatedByUserId: 'user_jane_001',
  },
  {
    id: 'upd_005',
    opportunityId: 'opp_001',
    accountId: 'acc_001',
    date: new Date(new Date().setDate(today.getDate() - 3)).toISOString(),
    content: 'Deployed new iteration of Phoenix platform to staging. Innovatech to begin UAT next week. Sent over staging credentials and test plan via email. Highlighted key areas for testing based on recent feature additions. All seems on track.',
    type: 'Email',
    createdAt: new Date(new Date().setDate(today.getDate() - 3)).toISOString(),
    updatedByUserId: 'user_admin_000',
  },
  {
    id: 'upd_lead_001',
    leadId: 'lead_001',
    date: new Date(new Date().setDate(today.getDate() - 1)).toISOString(),
    content: 'Initial contact call with Rintaro Okabe. Discussed their current challenges and potential fit for our solutions. Sent follow-up email with brochure. Seems interested.',
    type: 'Call',
    createdAt: new Date(new Date().setDate(today.getDate() - 1)).toISOString(),
    updatedByUserId: 'user_admin_000',
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
  mockAccounts.unshift(newAccount); // Add to the beginning
  return newAccount;
};

export const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'opportunityIds' | 'updateIds' >): Lead => {
  const newLead: Lead = {
    id: `lead_${new Date().getTime()}`,
    companyName: leadData.companyName,
    personName: leadData.personName,
    email: leadData.email,
    phone: leadData.phone,
    linkedinProfileUrl: leadData.linkedinProfileUrl,
    country: leadData.country,
    status: 'New' as LeadStatus,
    opportunityIds: [],
    updateIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockLeads.unshift(newLead); // Add to the beginning
  return newLead;
};

export const convertLeadToAccount = (leadId: string): Account | null => {
  const leadIndex = mockLeads.findIndex(l => l.id === leadId);
  if (leadIndex === -1) return null;

  const lead = mockLeads[leadIndex];
  if (lead.status === "Converted to Account" || lead.status === "Lost") return null;

  const existingAccount = mockAccounts.find(acc => acc.convertedFromLeadId === leadId || (acc.name === lead.companyName && acc.contactPersonName === lead.personName));
  if (existingAccount) {
     existingAccount.status = 'Active';
     existingAccount.contactEmail = lead.email || existingAccount.contactEmail;
     existingAccount.contactPhone = lead.phone || existingAccount.contactPhone;
     existingAccount.updatedAt = new Date().toISOString();
     
     mockLeads[leadIndex].status = "Converted to Account";
     mockLeads[leadIndex].updatedAt = new Date().toISOString();
     return existingAccount;
  }

  const newAccount = addAccount({
    name: lead.companyName,
    type: 'Client' as AccountType,
    status: 'Active' as AccountStatus,
    description: `Account converted from lead: ${lead.personName} - ${lead.companyName}. LinkedIn: ${lead.linkedinProfileUrl || 'N/A'}. Country: ${lead.country || 'N/A'}.`,
    contactPersonName: lead.personName,
    contactEmail: lead.email,
    contactPhone: lead.phone,
    convertedFromLeadId: lead.id,
  });

  mockLeads[leadIndex].status = "Converted to Account";
  mockLeads[leadIndex].updatedAt = new Date().toISOString();
  
  return newAccount;
};


export const addOpportunity = (opportunityData: Omit<Opportunity, 'id' | 'updateIds' | 'createdAt' | 'updatedAt' | 'status' | 'startDate' | 'endDate'> & { accountId: string }): Opportunity => {
  const newOpportunity: Opportunity = {
    id: `opp_${new Date().getTime()}`,
    name: opportunityData.name,
    accountId: opportunityData.accountId,
    description: opportunityData.description,
    value: opportunityData.value,
    status: 'Need Analysis' as OpportunityStatus,
    updateIds: [],
    startDate: today.toISOString(),
    endDate: new Date(new Date().setMonth(today.getMonth() + 1)).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockOpportunities.unshift(newOpportunity); 
  
  const account = mockAccounts.find(a => a.id === newOpportunity.accountId);
  if (account) {
    account.opportunityIds.push(newOpportunity.id);
    account.updatedAt = new Date().toISOString();
  }
  return newOpportunity;
};

type AddUpdateData = {
  type: UpdateType;
  content: string;
  updatedByUserId?: string;
} & ({ leadId: string; opportunityId?: never; accountId?: never } | { opportunityId: string; accountId: string; leadId?: never });


export const addUpdate = (data: AddUpdateData): Update => {
  const newUpdateBase = {
    id: `upd_${new Date().getTime()}`,
    type: data.type,
    content: data.content,
    updatedByUserId: data.updatedByUserId || 'user_admin_000',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  let newUpdate: Update;

  if (data.leadId) {
    newUpdate = {
      ...newUpdateBase,
      leadId: data.leadId,
    };
    const leadIndex = mockLeads.findIndex(lead => lead.id === data.leadId);
    if (leadIndex > -1) {
      if (!mockLeads[leadIndex].updateIds) {
        mockLeads[leadIndex].updateIds = [];
      }
      mockLeads[leadIndex].updateIds!.push(newUpdate.id);
      mockLeads[leadIndex].updatedAt = new Date().toISOString();
    }
  } else if (data.opportunityId && data.accountId) {
    newUpdate = {
      ...newUpdateBase,
      opportunityId: data.opportunityId,
      accountId: data.accountId,
    };
    const opportunityIndex = mockOpportunities.findIndex(opp => opp.id === data.opportunityId);
    if (opportunityIndex > -1) {
      mockOpportunities[opportunityIndex].updateIds.push(newUpdate.id);
      mockOpportunities[opportunityIndex].updatedAt = new Date().toISOString();

      const accountIndex = mockAccounts.findIndex(acc => acc.id === data.accountId);
      if (accountIndex > -1) {
        mockAccounts[accountIndex].updatedAt = new Date().toISOString();
      }
    }
  } else {
    throw new Error("Update must be linked to either a Lead or an Opportunity with an Account.");
  }

  mockUpdates.unshift(newUpdate);
  return newUpdate;
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
  return mockOpportunities.filter(o => o.accountId === accountId).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const getUpdatesForOpportunity = (opportunityId: string): Update[] => {
  return mockUpdates.filter(u => u.opportunityId === opportunityId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

export const getUnconvertedLeads = (): Lead[] => {
  return mockLeads.filter(lead => lead.status !== 'Converted to Account' && lead.status !== 'Lost').sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const getRecentUpdates = (limit: number = 3): Update[] => { 
  return [...mockUpdates] 
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};
