"use client";

import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import UpdateItem from '@/components/updates/UpdateItem';
import { mockUpdates, mockProjects } from '@/lib/data';
import type { Update, UpdateType } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input'; // Using Input for date, consider DatePicker
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {format, parseISO, isValid} from 'date-fns';


export default function UpdatesPage() {
  const [searchTerm, setSearchTerm] = useState(''); // For update content
  const [typeFilter, setTypeFilter] = useState<UpdateType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD

  const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];

  const filteredUpdates = mockUpdates.filter(update => {
    const matchesSearch = update.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || update.type === typeFilter;
    const matchesProject = projectFilter === 'all' || update.projectId === projectFilter;
    let matchesDate = true;
    if (dateFilter) {
      try {
        const filterDate = parseISO(dateFilter);
        const updateDate = parseISO(update.date);
        if (isValid(filterDate) && isValid(updateDate)) {
           matchesDate = format(updateDate, 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd');
        } else {
            matchesDate = false; // or true if you want to ignore invalid dates
        }
      } catch (e) {
        matchesDate = true; // Ignore if date parsing fails
      }
    }
    return matchesSearch && matchesType && matchesProject && matchesDate;
  });

  return (
    <div className="container mx-auto">
      <PageTitle title="Communication Updates" subtitle="Log and review all project-related communications.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Log New Update
        </Button>
      </PageTitle>

      <Card className="mb-6 p-4 shadow">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="search-updates" className="text-sm font-medium">Search Content</Label>
              <Input
                id="search-updates"
                type="text"
                placeholder="Keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="type-filter" className="text-sm font-medium">Type</Label>
              <Select value={typeFilter} onValueChange={(value: UpdateType | 'all') => setTypeFilter(value)}>
                <SelectTrigger id="type-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {updateTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="project-filter" className="text-sm font-medium">Project</Label>
              <Select value={projectFilter} onValueChange={(value: string | 'all') => setProjectFilter(value)}>
                <SelectTrigger id="project-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {mockProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter" className="text-sm font-medium">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {filteredUpdates.length > 0 ? (
        <div className="space-y-6">
          {filteredUpdates.map((update) => (
            <UpdateItem key={update.id} update={update} />
          ))}
        </div>
      ) : (
         <div className="text-center py-10">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-foreground">No Updates Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}

// Minimal Label and Card components used inline for brevity
const Label = ({ htmlFor, children, className }: { htmlFor: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-muted-foreground ${className}`}>
    {children}
  </label>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
