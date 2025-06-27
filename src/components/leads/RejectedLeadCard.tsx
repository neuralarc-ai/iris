import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Mail, Phone, MapPin, ExternalLink, CheckCircle, XCircle, Edit } from 'lucide-react';
import { Lead } from '@/types';

interface RejectedLeadCardProps {
  lead: Lead;
  onApprove?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onUpdate?: (leadId: string, updatedLead: Partial<Lead>) => void;
}

export default function RejectedLeadCard({ lead, onApprove, onDelete, onUpdate }: RejectedLeadCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editData, setEditData] = React.useState({
    companyName: lead.companyName,
    personName: lead.personName,
    email: lead.email,
    phone: lead.phone || '',
    linkedinProfileUrl: lead.linkedinProfileUrl || '',
    country: lead.country || ''
  });
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const handleCardClick = () => {
    setIsEditModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editData.companyName.trim() || editData.companyName.trim().length < 3) {
      errors.companyName = 'Company name must be at least 3 characters';
    }
    
    if (!editData.personName.trim() || editData.personName.trim().length < 3) {
      errors.personName = 'Contact name must be at least 3 characters';
    }
    
    if (!editData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (editData.phone && editData.phone.length < 7) {
      errors.phone = 'Phone number must be at least 7 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
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
    setValidationErrors({});
    setIsEditModalOpen(false);
  };

  const handleApprove = () => {
    if (!validateForm()) return;
    
    if (onUpdate) {
      onUpdate(lead.id, editData);
    }
    
    if (onApprove) {
      onApprove(lead.id);
    }
    
    setIsEditModalOpen(false);
  };

  return (
    <>
      <Card 
        className="shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {lead.companyName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{lead.personName}</p>
            </div>
            <Badge variant="destructive" className="text-xs px-2 py-1">
              Rejected
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
          
          {/* Rejection Reasons */}
          {lead.rejectionReasons && lead.rejectionReasons.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-red-700 dark:text-red-400">Rejection Reasons:</h4>
              <div className="space-y-1">
                {lead.rejectionReasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Created Date */}
          <div className="text-xs text-muted-foreground pt-1">
            Created: {new Date(lead.createdAt).toLocaleDateString('en-GB')}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            {onApprove && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50 h-8 text-xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit & Approve
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
        <DialogContent className="max-w-md w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Rejected Lead
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm">Company Name *</Label>
              <Input
                id="companyName"
                value={editData.companyName}
                onChange={(e) => setEditData(prev => ({ ...prev, companyName: e.target.value }))}
                className={validationErrors.companyName ? 'border-red-500' : ''}
                placeholder="Enter company name"
              />
              {validationErrors.companyName && (
                <p className="text-xs text-red-500">{validationErrors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="personName" className="text-sm">Contact Name *</Label>
              <Input
                id="personName"
                value={editData.personName}
                onChange={(e) => setEditData(prev => ({ ...prev, personName: e.target.value }))}
                className={validationErrors.personName ? 'border-red-500' : ''}
                placeholder="Enter contact name"
              />
              {validationErrors.personName && (
                <p className="text-xs text-red-500">{validationErrors.personName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className={validationErrors.email ? 'border-red-500' : ''}
                placeholder="Enter email address"
              />
              {validationErrors.email && (
                <p className="text-xs text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Phone Number</Label>
              <Input
                id="phone"
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                className={validationErrors.phone ? 'border-red-500' : ''}
                placeholder="Enter phone number"
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-500">{validationErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinProfileUrl" className="text-sm">LinkedIn Profile URL</Label>
              <Input
                id="linkedinProfileUrl"
                value={editData.linkedinProfileUrl}
                onChange={(e) => setEditData(prev => ({ ...prev, linkedinProfileUrl: e.target.value }))}
                placeholder="Enter LinkedIn URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm">Country</Label>
              <Input
                id="country"
                value={editData.country}
                onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Enter country"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              variant="outline" 
              className="text-green-600 border-green-200 hover:bg-green-50 w-full sm:w-auto"
              onClick={handleSave}
            >
              Save Changes
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              onClick={handleApprove}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 