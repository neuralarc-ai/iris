import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Archive, Mail, Phone, MapPin, ExternalLink, RotateCcw, XCircle, Edit } from 'lucide-react';
import { Lead } from '@/types';

interface ArchivedLeadCardProps {
  lead: Lead;
  userNamesById?: Record<string, string>;
  onRestore?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onUpdate?: (leadId: string, updatedLead: Partial<Lead>) => void;
}

export default function ArchivedLeadCard({ lead, userNamesById = {}, onRestore, onDelete, onUpdate }: ArchivedLeadCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = React.useState(false);
  const [editData, setEditData] = React.useState({
    companyName: lead.companyName,
    personName: lead.personName,
    email: lead.email,
    phone: lead.phone || '',
    linkedinProfileUrl: lead.linkedinProfileUrl || '',
    country: lead.country || ''
  });

  const handleCardClick = () => {
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(lead.id, editData);
    }
    
    setIsEditModalOpen(false);
  };

  const handleCancel = () => {
    setEditData({
      companyName: lead.companyName,
      personName: lead.personName,
      email: lead.email,
      phone: lead.phone || '',
      linkedinProfileUrl: lead.linkedinProfileUrl || '',
      country: lead.country || ''
    });
    setIsEditModalOpen(false);
  };

  const handleRestore = () => {
    // Open confirmation dialog
    setIsConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = () => {
    if (onUpdate) {
      onUpdate(lead.id, editData);
    }
    
    if (onRestore) {
      onRestore(lead.id);
    }
    
    setIsEditModalOpen(false);
    setIsConfirmRestoreOpen(false);
  };

  return (
    <>
      <Card 
        className="shadow-sm border-l-4 border-l-orange-500 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Archive className="h-4 w-4 text-orange-500" />
                {lead.companyName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{lead.personName}</p>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-orange-100 text-orange-700 border-orange-200">
              Archived
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Contact Information */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline text-sm">
                {lead.email}
              </a>
            </div>
            
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{lead.phone}</span>
              </div>
            )}
            
            {lead.country && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{lead.country}</span>
              </div>
            )}
            
            {lead.linkedinProfileUrl && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <a 
                  href={lead.linkedinProfileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
          
          {/* Archive Information */}
          {lead.archivedAt && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-orange-700 dark:text-orange-400">Archive Information:</h4>
              <div className="space-y-1">
                <div className="flex items-start gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                  <Archive className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">Archived on {new Date(lead.archivedAt).toLocaleDateString('en-GB')}</span>
                </div>
                {lead.archivedBy && (
                  <div className="flex items-start gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                    <span className="text-xs">by {userNamesById[lead.archivedBy] || lead.archivedBy}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Created Date */}
          <div className="text-xs text-muted-foreground pt-1">
            Created: {new Date(lead.createdAt).toLocaleDateString('en-GB')}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {onRestore && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit & Restore
              </Button>
            )}
            {onDelete && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                onClick={() => onDelete(lead.id)}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] bg-white dark:bg-gray-900">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Edit className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div>Edit Archived Lead</div>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  Update the information and restore this lead
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Lead Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-3">Current Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <p className="font-medium">{lead.companyName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact:</span>
                  <p className="font-medium">{lead.personName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{lead.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{lead.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Country:</span>
                  <p className="font-medium">{lead.country || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">LinkedIn:</span>
                  <p className="font-medium">{lead.linkedinProfileUrl || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Edit Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={editData.companyName}
                    onChange={(e) => setEditData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="personName">Contact Person *</Label>
                  <Input
                    id="personName"
                    value={editData.personName}
                    onChange={(e) => setEditData(prev => ({ ...prev, personName: e.target.value }))}
                    placeholder="Enter contact person name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={editData.country}
                    onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter country"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkedinProfileUrl">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedinProfileUrl"
                    value={editData.linkedinProfileUrl}
                    onChange={(e) => setEditData(prev => ({ ...prev, linkedinProfileUrl: e.target.value }))}
                    placeholder="Enter LinkedIn profile URL"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Restore Dialog */}
      <AlertDialog open={isConfirmRestoreOpen} onOpenChange={setIsConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Archived Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this archived lead? This will move it back to your active leads list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore} className="bg-green-600 hover:bg-green-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 