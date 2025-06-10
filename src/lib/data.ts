import type { Account, Project, Update, User } from '@/types';
import { DEMO_PIN } from '@/lib/constants';

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
    createdAt: new Date(new Date().setDate(today.getDate() - 60)).toISOString(),
    updatedAt: oneWeekAgo.toISOString(),
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

export const addUser = (name: string, email: string): User => {
  const newUser: User = {
    id: `user_${new Date().getTime()}`,
    name,
    email,
    pin: Math.floor(100000 + Math.random() * 900000).toString(),
    createdAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  return newUser;
};

export const updateUserPin = (userId: string, newPin: string): boolean => {
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex > -1) {
    mockUsers[userIndex].pin = newPin;
    // If updating the admin user, also update the DEMO_PIN in constants (not really, but for this mock setup)
    // This part is tricky with mock data. For a real app, DEMO_PIN is a fallback, not the live admin PIN.
    // For this exercise, we'll assume the admin PIN in mockUsers is the source of truth after initial load.
    return true;
  }
  return false;
};

export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find(user => user.id === userId);
};

export const getProjectsForAccount = (accountId: string): Project[] => {
  return mockProjects.filter(p => p.accountId === accountId);
}

export const getUpdatesForProject = (projectId: string): Update[] => {
  return mockUpdates.filter(u => u.projectId === projectId);
}
