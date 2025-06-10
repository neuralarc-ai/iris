
"use client";

import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import ProjectCard from '@/components/projects/ProjectCard';
import { mockProjects, mockAccounts, mockLeads } from '@/lib/data'; // Added mockLeads
import type { Project, ProjectStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Local Card and Label components if not using global ones from ui/card or ui/label
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [entityFilter, setEntityFilter] = useState<string | 'all'>('all'); // Combined filter for leads and accounts

  const projectStatusOptions: ProjectStatus[] = ["Need Analysis", "Negotiation", "In Progress", "On Hold", "Completed", "Cancelled"];

  // Combine leads and accounts for the filter dropdown
  const entityOptions = [
    ...mockLeads.map(lead => ({ id: `lead_${lead.id}`, name: `${lead.companyName} (Lead)` })),
    ...mockAccounts.map(account => ({ id: `account_${account.id}`, name: `${account.name} (Account)` }))
  ];

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    let matchesEntity = true;
    if (entityFilter !== 'all') {
      const [type, id] = entityFilter.split('_');
      if (type === 'lead') {
        matchesEntity = project.leadId === id;
      } else if (type === 'account') {
        matchesEntity = project.accountId === id;
      }
    }
    return matchesSearch && matchesStatus && matchesEntity;
  });

  return (
    <div className="container mx-auto">
      <PageTitle title="Project Management" subtitle="Track and manage all ongoing and upcoming projects.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Project
        </Button>
      </PageTitle>

      <Card className="mb-6 p-4 shadow">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="search-projects">Search Projects</Label>
              <Input
                id="search-projects"
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: ProjectStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {projectStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity-filter">Lead / Account</Label>
              <Select value={entityFilter} onValueChange={(value: string | 'all') => setEntityFilter(value)}>
                <SelectTrigger id="entity-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by lead or account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads/Accounts</SelectItem>
                  {entityOptions.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground">No Projects Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
