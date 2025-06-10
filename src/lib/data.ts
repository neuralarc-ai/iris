import type { Account, Project, Update } from '@/types';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const oneWeekAgo = new Date(today);
oneWeekAgo.setDate(today.getDate() - 7);
const oneMonthAgo = new Date(today);
oneMonthAgo.setMonth(today.getMonth() - 1);

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
  },
  {
    id: 'acc_002',
    name: 'Synergy Partners Inc.',
    type: 'Channel Partner',
    status: 'Active',
    description: 'Strategic partner for market expansion in the APAC region. Strong reseller network.',
    projectIds: ['proj_003'],
    createdAt: new Date(today.setDate(today.getDate() - 60)).toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
  },
  {
    id: 'acc_003',
    name: 'Global Corp Ltd.',
    type: 'Client',
    status: 'Inactive',
    description: 'Large multinational corporation. Previous engagement completed, exploring new opportunities.',
    projectIds: [],
    createdAt: new Date(today.setDate(today.getDate() - 120)).toISOString(),
    updatedAt: new Date(today.setDate(today.getDate() - 30)).toISOString(),
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
    endDate: new Date(today.setMonth(today.getMonth() + 2)).toISOString(),
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
    startDate: new Date(today.setDate(today.getDate() + 7)).toISOString(),
    endDate: new Date(today.setMonth(today.getMonth() + 1)).toISOString(),
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
    startDate: new Date(today.setDate(today.getDate() + 14)).toISOString(),
    endDate: new Date(today.setMonth(today.getMonth() + 6)).toISOString(),
    description: 'Partnership with Synergy Partners for launching services in the Asia-Pacific market.',
    updateIds: ['upd_003'],
    createdAt: new Date(today.setDate(today.getDate() - 10)).toISOString(),
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
    date: today.toISOString(),
    content: 'Received revised proposal from Synergy Partners. Legal team is reviewing the terms. Follow-up meeting scheduled for next week.',
    type: 'Email',
    createdAt: today.toISOString(),
  },
];

export const getProjectsForAccount = (accountId: string): Project[] => {
  return mockProjects.filter(p => p.accountId === accountId);
}

export const getUpdatesForProject = (projectId: string): Update[] => {
  return mockUpdates.filter(u => u.projectId === projectId);
}
