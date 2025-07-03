import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Building2, Box, Upload, ArrowLeft, ArrowRight, Pencil, Check, X } from 'lucide-react';

const industryOptions = [
  'SaaS', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Technology', 'Other'
];

export default function CompanyProfileDialog({ open, onOpenChange, onImportLeadsFile }: { open: boolean; onOpenChange: (v: boolean) => void; onImportLeadsFile?: (file: File) => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [services, setServices] = useState<{ name: string; category: string; description: string; targetMarket: string }[]>([]);
  const [newService, setNewService] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Service',
    description: '',
    targetMarket: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // File input ref for import step
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Add a derived boolean to indicate if company info exists
  const hasCompanyInfo = Boolean(companyId);

  // When dialog opens and company info exists, always set step to 1
  useEffect(() => {
    if (open && hasCompanyInfo) setStep(1);
  }, [open, hasCompanyInfo]);

  useEffect(() => {
    if (open) {
      fetchCompany();
    }
    if (!open) setStep(1);
    // eslint-disable-next-line
  }, [open]);

  // Fetch user role on mount
  useEffect(() => {
    const fetchRole = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (!error && data) setUserRole(data.role);
    };
    fetchRole();
  }, []);

  const fetchCompany = async () => {
    const { data, error } = await supabase.from('company').select('*').single();
    if (data) {
      setCompanyId(data.id);
      setCompanyName(data.name || '');
      setWebsite(data.website || '');
      setIndustry(data.industry || '');
      setCompanyDescription(data.description || '');
      fetchServices(data.id);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const fetchServices = async (companyId: string) => {
    const { data } = await supabase.from('company_service').select('*').eq('company_id', companyId);
    setServices(data ? data.map((s: any) => ({
      name: s.name || '',
      category: s.category || 'Service',
      description: s.description || '',
      targetMarket: s.target_market || ''
    })) : []);
  };

  const handleAddService = () => {
    if (newService.trim() && !services.some(s => s.name === newService.trim())) {
      setServices([...services, { name: newService.trim(), category: 'Service', description: '', targetMarket: '' }]);
      setNewService('');
    }
  };

  const handleRemoveService = (name: string) => {
    setServices(services.filter(s => s.name !== name));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let cid = companyId;
      if (!cid) {
        // Insert new company
        const { data, error } = await supabase.from('company').insert({
          name: companyName,
          website,
          industry,
          description: companyDescription
        }).select().single();
        if (data) cid = data.id;
        setCompanyId(cid!);
      } else {
        // Update existing company
        await supabase.from('company').update({
          name: companyName,
          website,
          industry,
          description: companyDescription
        }).eq('id', cid);
      }
      // Upsert services
      if (cid) {
        await supabase.from('company_service').delete().eq('company_id', cid);
        if (services.length > 0) {
          await supabase.from('company_service').insert(
            services.map(s => ({
              company_id: cid,
              name: s.name,
              category: s.category,
              description: s.description,
              target_market: s.targetMarket
            }))
          );
        }
      }
      toast({ title: 'Success', description: 'Company profile saved.', className: 'bg-green-100 dark:bg-green-900 border-green-500' });
      setIsEditing(false);
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save company profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle file drop or selection
  const handleFile = (file: File) => {
    if (onImportLeadsFile) {
      onOpenChange(false);
      onImportLeadsFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Add a function to reset fields to their last saved values
  const handleCancelEdit = () => {
    fetchCompany(); // refetches and resets all fields
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full rounded-xl bg-white max-h-[900px] flex flex-col p-0 overflow-hidden">
        <DialogTitle className="sr-only">Company Profile Setup</DialogTitle>
        <div className="flex flex-col px-8 pt-8 pb-2">
          <div className="mb-2 flex flex-col gap-0">
            <div className="text-xl font-semibold leading-tight flex items-center">
              Company Profile
              {companyId && !isEditing && userRole === 'admin' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-5 w-5 text-[#998876]" />
                </Button>
              )}
              {companyId && isEditing && userRole === 'admin' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Check className="h-5 w-5 text-[#97A487]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-5 w-5 text-[#916D5B]" />
                  </Button>
                </>
              )}
            </div>
            <div className="text-sm text-[#5E6156] leading-tight mt-1">Configure your company details for personalized insights</div>
          </div>
          {(!hasCompanyInfo) && (
            <div className="flex items-center gap-4 mb-4">
              {/* Stepper Indicator */}
              <div className="flex items-center gap-2">
                <span className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${step === 1 ? 'border-[#282828] bg-[#282828] text-white' : 'border-[#E0E0E0] bg-white text-[#B0B0B0]'}`}> <Building2 className="w-5 h-5" /> </span>
                <div className={`h-1 w-8 ${step === 2 ? 'bg-[#282828]' : 'bg-[#E0E0E0]'}`}></div>
                <span className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${step === 2 ? 'border-[#282828] bg-[#282828] text-white' : 'border-[#E0E0E0] bg-white text-[#B0B0B0]'}`}> <Upload className="w-5 h-5" /> </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          {(!hasCompanyInfo && step === 2) ? (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="bg-[#F8F7F3] p-6 rounded-xl">
                <div className="mb-4">
                  <p className="font-semibold text-[#282828] text-base mb-1">Import Your Leads</p>
                  <p className="text-sm text-[#5E6156]">Start building relationships by importing your existing leads with AI-powered enhancement.</p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#282828] text-base">File Upload</span>
                    <Button type="button" variant="outline" className="rounded-lg px-4 py-2 font-medium text-base border-[#E0E0E0] text-[#282828] max-h-12 max-w-fit">Download Template</Button>
                  </div>
                  <div
                    className="bg-white border-2 border-dashed border-[#E0E0E0] rounded-xl flex flex-col items-center justify-center py-10 mb-2 cursor-pointer"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    aria-label="Upload file"
                  >
                    <Upload className="w-10 h-10 text-[#B0B0B0] mb-2" />
                    <span className="text-base font-medium text-[#282828]">Drop your files here</span>
                    <span className="text-sm text-[#5E6156]">or click to browse</span>
                    <span className="text-xs text-[#B0B0B0] mt-2">Supports CSV, Excel (.xlsx/.xls), and Google Sheets</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-row sm:justify-between w-full items-center mb-0">
                <div className="flex-1 flex justify-start">
                  <Button type="button" variant="outline" className="sm:max-w-fit sm:w-fit max-h-12 px-2 flex items-center gap-1" onClick={() => setStep(1)} disabled={!isEditing}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                </div>
                <div className="flex-1 flex justify-end">
                  <Button type="submit" className="sm:max-w-fit sm:w-fit max-h-12 px-2 bg-[#282828] text-white hover:bg-[#3a322c] rounded-md flex items-center gap-1" disabled={!isEditing || isSaving}>
                    Finish <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </DialogFooter>
            </form>
          ) : (
            <form className="space-y-4" noValidate onSubmit={e => { e.preventDefault(); setStep(2); }}>
              <div className="bg-[#F8F7F3] border border-[#E0E0E0] rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter your company name" required readOnly={!isEditing} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Website URL *</label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourcompany.com" required readOnly={!isEditing} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Industry *</label>
                    <Select value={industry} onValueChange={setIndustry} disabled={!isEditing}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryOptions.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Company Description *</label>
                    <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="Describe your company's products, services, and value proposition..." required className="resize-none min-h-[100px]" readOnly={!isEditing} />
                  </div>
                </div>
              </div>
              <div className="bg-[#F8F7F3] border border-[#E0E0E0] rounded-xl mt-6 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Box className="w-6 h-6 text-[#282828]" />
                    <span className="text-lg font-semibold text-[#282828]">Services & Products</span>
                  </div>
                  <Button type="button" variant="outline" className="rounded-lg px-4 py-2 font-medium text-base border-[#E0E0E0] text-[#282828] max-h-12 max-w-fit" onClick={() => setShowAddService(true)} disabled={!isEditing}>
                    + Add Service
                  </Button>
                </div>
                {showAddService && (
                  <div className="bg-white border border-[#E0E0E0] rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Service Name</label>
                        <Input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter service name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <Select value={serviceForm.category} onValueChange={v => setServiceForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Service">Service</SelectItem>
                            <SelectItem value="Product">Product</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this service or product" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Target Market</label>
                      <Input value={serviceForm.targetMarket} onChange={e => setServiceForm(f => ({ ...f, targetMarket: e.target.value }))} placeholder="Who is this for? (e.g., Small businesses, Enterprise clients)" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button type="button" className="bg-black text-white px-4" onClick={() => {
                        setServices([...services, { ...serviceForm }]);
                        setShowAddService(false);
                        setServiceForm({ name: '', category: 'Service', description: '', targetMarket: '' });
                      }} disabled={!serviceForm.name.trim()}>Add Service</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddService(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                {services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-[#B0B0B0] py-8">
                    <Box className="w-12 h-12 mb-2" />
                    <span className="text-lg font-medium">No services added yet</span>
                    <span className="text-sm">Add your company's services and products</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto">
                    {services.map((s, i) => (
                      <div key={i} className="rounded-2xl border border-[#E0E0E0] bg-white p-4 min-w-[220px] max-w-xs h-40 flex flex-col gap-2 relative">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-[#282828]">{s.name}</span>
                          <span className="bg-[#F8F7F3] text-[#282828] text-xs font-semibold rounded-full px-3 py-1 capitalize max-h-6 flex items-center">{s.category}</span>
                          <button type="button" className="ml-auto text-xl text-[#282828] hover:text-red-500 max-h-6" onClick={() => handleRemoveService(s.name)} disabled={!isEditing}>
                            ×
                          </button>
                        </div>
                        <div className="text-[#5E6156] text-base mb-1">{s.description}</div>
                        <div className="text-[#888] text-sm">Target: {s.targetMarket}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-row sm:justify-between w-full items-center mb-0">
                <div className="flex-1 flex justify-start">
                  <Button type="button" variant="outline" className="sm:max-w-fit sm:w-fit max-h-12 px-2 flex items-center gap-1" disabled={Number(step) === 1} onClick={() => setStep(Number(step) - 1)}>
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </Button>
                </div>
                <div className="flex-1 flex justify-end gap-4">
                  <Button type="button" variant="ghost" className="self-center text-[#282828] text-sm font-medium cursor-pointer hover:underline" onClick={() => onOpenChange(false)}>
                    Skip for Now
                  </Button>
                  <Button type="submit" className="sm:max-w-fit sm:w-fit max-h-12 px-2 bg-[#282828] text-white hover:bg-[#3a322c] rounded-md flex items-center gap-1" disabled={Number(step) === 2 || !isEditing}>
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 