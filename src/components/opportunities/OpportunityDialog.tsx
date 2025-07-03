import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { History, Briefcase, FileText, Coins, CalendarDays, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, MinusCircle, Clock, Activity, Pencil, X, Check, Mail, Phone, Users } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import type { Opportunity, OpportunityStatus, Update, Account } from "@/types";

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity;
  accountName?: string;
  onStatusChange?: (newStatus: OpportunityStatus) => void;
  onValueChange?: (newValue: number) => void;
  onTimelineChange?: (newStartDate: string, newEndDate: string) => void;
  selectMode?: boolean;
  onSelect?: () => void;
}

const getUpdateTypeIcon = (type: Update["type"]) => {
  switch (type) {
    case "Call":
      return <Phone className="h-4 w-4 text-blue-500" />;
    case "Email":
      return <Mail className="h-4 w-4 text-green-500" />;
    case "Meeting":
      return <Users className="h-4 w-4 text-purple-500" />;
    case "General":
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadgeColorClasses = (status: Opportunity["status"]): string => {
  switch (status) {
    case "Scope Of Work":
      return "bg-sky-500/20 text-sky-700 border-sky-500/30";
    case "Proposal":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Negotiation":
      return "bg-amber-500/20 text-amber-700 border-amber-500/30";
    case "Win":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Loss":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    case "On Hold":
      return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/30";
  }
};

function safeParseISO(dateString?: string): Date | null {
  if (!dateString) return null;
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : null;
}

export default function OpportunityDialog({
  open,
  onOpenChange,
  opportunity,
  accountName,
  onStatusChange,
  onValueChange,
  onTimelineChange,
  selectMode,
  onSelect,
}: OpportunityDialogProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editOpportunity, setEditOpportunity] = useState({
    name: opportunity.name,
    value: opportunity.value.toString(),
    status: opportunity.status,
    description: opportunity.description || "",
    accountName: accountName || "",
  });
  const [editStatus, setEditStatus] = useState<OpportunityStatus>(opportunity.status as OpportunityStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValue, setEditValue] = useState(opportunity.value.toString());
  const [isUpdatingValue, setIsUpdatingValue] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Update[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [newActivityDescription, setNewActivityDescription] = useState("");
  const [newActivityType, setNewActivityType] = useState<"General" | "Call" | "Meeting" | "Email">("General");
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setEditOpportunity({
      name: opportunity.name,
      value: opportunity.value.toString(),
      status: opportunity.status,
      description: opportunity.description || "",
      accountName: accountName || "",
    });
    setEditStatus(opportunity.status as OpportunityStatus);
    setEditValue(opportunity.value.toString());
  }, [opportunity, accountName]);

  // Fetch activity logs
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const { data: logsData } = await supabase
          .from("update")
          .select("*")
          .eq("opportunity_id", opportunity.id)
          .order("date", { ascending: false });
        if (logsData) {
          const transformedLogs = logsData.map((log: any) => ({
            id: log.id,
            type: log.type,
            content: log.content || "",
            updatedByUserId: log.updated_by_user_id,
            date: log.date || log.created_at || new Date().toISOString(),
            createdAt: log.created_at || new Date().toISOString(),
            leadId: log.lead_id,
            opportunityId: log.opportunity_id,
            accountId: log.account_id,
            nextActionDate: log.next_action_date,
          }));
          setActivityLogs(transformedLogs);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    if (open) fetchLogs();
  }, [opportunity.id, open]);

  const handleLogActivity = async () => {
    if (!newActivityDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description for the activity.",
        variant: "destructive",
      });
      return;
    }
    if (!newActivityType) {
      toast({
        title: "Error",
        description: "Please select an activity type.",
        variant: "destructive",
      });
      return;
    }
    if (isLoggingActivity) return;
    setIsLoggingActivity(true);
    try {
      const currentUserId = localStorage.getItem("user_id");
      if (!currentUserId) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("update")
        .insert([
          {
            type: newActivityType,
            content: newActivityDescription,
            updated_by_user_id: currentUserId,
            date: new Date().toISOString(),
            lead_id: null,
            opportunity_id: opportunity.id,
            account_id: opportunity.accountId,
            next_action_date: nextActionDate?.toISOString() || null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      const newUpdate: Update = {
        id: data.id,
        type: data.type,
        content: data.content || "",
        updatedByUserId: data.updated_by_user_id,
        date: data.date || data.created_at || new Date().toISOString(),
        createdAt: data.created_at || new Date().toISOString(),
        leadId: data.lead_id,
        opportunityId: data.opportunity_id,
        accountId: data.account_id,
        nextActionDate: data.next_action_date,
      };
      setActivityLogs((prev) => [newUpdate, ...prev]);
      setNewActivityDescription("");
      setNewActivityType("General");
      setNextActionDate(undefined);
      toast({ title: "Success", description: "Activity logged successfully." });
    } catch (error) {
      console.error("Failed to log activity:", error);
      toast({
        title: "Error",
        description: "Failed to log activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const statusOptions = [
    "Scope Of Work",
    "Proposal",
    "Negotiation",
    "On Hold",
    "Win",
    "Loss",
  ];

  const handleStatusChange = async (newStatus: OpportunityStatus) => {
    setIsUpdatingStatus(true);
    const { error } = await supabase
      .from("opportunity")
      .update({ status: newStatus })
      .eq("id", opportunity.id);
    if (!error) {
      setEditStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Status changed to ${newStatus}`,
      });
      if (onStatusChange) onStatusChange(newStatus);
    } else {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
    setIsUpdatingStatus(false);
  };

  // UI rendering
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-white border-0 rounded-lg p-0 focus-within:ourline-0 focus-within:ring-0 focus-visible:outline-0 focus-visible:ring-0">
        <div className="p-6 pb-0">
          <DialogHeader className="">
            <div className="flex items-start gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-[#5E6156] rounded-full flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <Input
                        value={editOpportunity.name}
                        onChange={e => setEditOpportunity({
                          ...editOpportunity,
                          name: e.target.value
                        })}
                        className="text-2xl font-bold text-[#282828] border-0 border-b-2 border-[#916D5B] bg-transparent px-0 rounded-none placeholder:text-3xl min-w-[210px]"
                        placeholder="Opportunity Name"
                        autoFocus
                      />
                    ) : (
                      <DialogTitle className="text-2xl font-bold text-[#282828]">
                        {opportunity.name}
                      </DialogTitle>
                    )}
                    {!editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1"
                        onClick={() => setEditMode(true)}
                      >
                        <Pencil className="h-5 w-5 text-[#998876]" />
                      </Button>
                    )}
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1 flex-shrink-0"
                        onClick={() => {
                          setEditMode(false);
                          setEditOpportunity({
                            name: opportunity.name,
                            value: opportunity.value.toString(),
                            status: opportunity.status,
                            description: opportunity.description || "",
                            accountName: accountName || "",
                          });
                        }}
                      >
                        <X className="h-5 w-5" style={{ color: "#916D5B" }} />
                      </Button>
                    )}
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1 flex-shrink-0"
                        onClick={async () => {
                          const updates: any = {};
                          if (editOpportunity.name !== opportunity.name)
                            updates.name = editOpportunity.name;
                          if (
                            editOpportunity.value !==
                            opportunity.value.toString()
                          )
                            updates.value = Number(
                              editOpportunity.value.replace(/,/g, "")
                            );
                          if (editOpportunity.status !== opportunity.status)
                            updates.status = editOpportunity.status;
                          if (
                            editOpportunity.description !==
                            opportunity.description
                          )
                            updates.description = editOpportunity.description;
                          if (Object.keys(updates).length > 0) {
                            await supabase
                              .from("opportunity")
                              .update(updates)
                              .eq("id", opportunity.id);
                          }
                          setEditMode(false);
                        }}
                      >
                        <Check className="h-5 w-5" style={{ color: "#97A487" }} />
                      </Button>
                    )}
                  </div>
                  <p className="text-lg text-[#5E6156] leading-tight">
                    {accountName || "No Account"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 mr-6">
                <Select
                  value={editMode ? editOpportunity.status : editStatus}
                  onValueChange={(val) => {
                    if (editMode)
                      setEditOpportunity({
                        ...editOpportunity,
                        status: val as OpportunityStatus,
                      });
                    else handleStatusChange(val as OpportunityStatus);
                  }}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger
                    className={`gap-2 sm:w-fit border-[#E5E3DF] mr-6 ${
                      editMode
                        ? "border-0 border-b-2 border-[#916D5B] rounded-none"
                        : ""
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="sm:w-fit">
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="w-full">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isUpdatingStatus && (
                  <span className="ml-2 text-xs text-[#998876]">Updating...</span>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#EFEDE7] h-fit w-fit mx-auto grid grid-cols-2 items-center p-1 rounded-lg justify-center shadow-none">
            <TabsTrigger
              value="overview"
              className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Briefcase className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="text-base px-4 py-1.5 rounded-md flex items-center gap-2 data-[state=active]:bg-[#2B2521] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Activity className="h-4 w-4" /> Activity
            </TabsTrigger>
          </TabsList>
          <div className="bg-white rounded-b-md p-6">
            <TabsContent value="overview" className="max-h-[708px] overflow-y-scroll">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6 flex flex-col h-full">
                  <div className="bg-white border border-[#E5E3DF] rounded-lg p-6 flex-1 flex flex-col justify-between">
                    <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                      <Briefcase className="h-5 w-5 text-[#5E6156]" /> Key Information
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-[#F8F7F3] p-4 rounded-md">
                        <div className="flex items-center gap-3">
                          <Coins className="h-5 w-5 text-[#916D5B] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-[#5E6156]">Value</p>
                            <div className="text-2xl font-bold text-[#282828] mt-1">
                              {editMode ? (
                                <Input
                                  value={editOpportunity.value}
                                  onChange={(e) =>
                                    setEditOpportunity({
                                      ...editOpportunity,
                                      value: e.target.value,
                                    })
                                  }
                                  className="w-fit border-0 border-b-2 border-[#916D5B] focus:ring-0 bg-transparent px-0 rounded-none text-2xl placeholder:text-2xl"
                                  placeholder="0"
                                />
                              ) : (
                                <span className="text-xl">
                                  $ {opportunity.value.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#F8F7F3] p-4 rounded-md">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-[#4B7B9D] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-[#5E6156]">Expected Close Date</p>
                            <p className="text-lg font-bold text-[#282828] mt-1">
                              {(() => {
                                const end = safeParseISO(opportunity.endDate);
                                return end ? format(end, "MMM dd, yyyy") : "N/A";
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#F8F7F3] p-4 rounded-md">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-[#5E6156]">Start Date</p>
                            <p className="text-lg font-bold text-[#282828] mt-1">
                              {opportunity.startDate ? format(new Date(opportunity.startDate), "MMM dd, yyyy") : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-[#E5E3DF] rounded-lg p-6 flex-1 flex flex-col justify-start">
                  <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-[#5E6156]" /> Description
                  </h3>
                  {editMode ? (
                    <Textarea
                      value={editOpportunity.description}
                      onChange={(e) =>
                        setEditOpportunity({
                          ...editOpportunity,
                          description: e.target.value,
                        })
                      }
                      className="min-h-[220px] resize-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-0 bg-[#F8F7F3] px-0 rounded-md mb-2"
                      placeholder="Enter a description..."
                    />
                  ) : (
                    <div className="bg-[#F8F7F3] p-4 rounded-md min-h-[220px] mb-2">
                      <p className="text-sm text-[#282828] leading-relaxed">
                        {opportunity.description || "No description available."}
                      </p>
                    </div>
                  )}
                  <div className="mt-7 flex items-center gap-2">
                    {(() => {
                      const end = safeParseISO(opportunity.endDate);
                      const start = safeParseISO(opportunity.startDate);
                      const now = new Date();
                      let statusLabel = "On Track";
                      let icon = <CheckCircle2 className="w-4 h-4" style={{ color: "#4BB543" }} />;
                      let tooltip = "This opportunity is currently on time.";
                      if (opportunity.status === "Win" || opportunity.status === "Loss") {
                        statusLabel = "Closed";
                        icon = <MinusCircle className="w-4 h-4" style={{ color: "#CBCAC5" }} />;
                        tooltip = "This opportunity is closed.";
                      } else if (end && now > end) {
                        statusLabel = "Overdue";
                        icon = <AlertTriangle className="w-4 h-4" style={{ color: "#E53E3E" }} />;
                        tooltip = "This opportunity is overdue.";
                      } else if (start && now < start) {
                        statusLabel = "Not started";
                        icon = <MinusCircle className="w-4 h-4" style={{ color: "#CBCAC5" }} />;
                        tooltip = "This opportunity has not started yet.";
                      } else if (end && start && now > start && now < end) {
                        statusLabel = "On Track";
                        icon = <CheckCircle2 className="w-4 h-4" style={{ color: "#4BB543" }} />;
                        tooltip = "This opportunity is currently on time.";
                      }
                      return (
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ECECEC] bg-white shadow-sm"
                          aria-label={`Status: ${statusLabel}`}
                          title={tooltip}
                        >
                          {icon}
                          <span className="text-sm font-semibold text-[#282828] tracking-tight">
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="activity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                  <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Add New Activity</div>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <label htmlFor="activity-type" className="text-sm font-medium text-[#5E6156] mb-2 block">Activity Type</label>
                        <Select
                          value={newActivityType}
                          onValueChange={(value) => setNewActivityType(value as "General" | "Call" | "Meeting" | "Email")}
                        >
                          <SelectTrigger id="activity-type" className="w-full border border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md">
                            <SelectValue placeholder="Select activity type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Call">Call</SelectItem>
                            <SelectItem value="Meeting">Meeting</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label htmlFor="next-action-date" className="text-sm font-medium text-[#5E6156] mb-2 block">Next Action Date (Optional)</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Input
                              id="next-action-date"
                              type="text"
                              value={nextActionDate ? format(nextActionDate, "dd/MM/yyyy") : ""}
                              placeholder="dd/mm/yyyy (optional)"
                              readOnly
                              disabled={isLoggingActivity}
                              className="cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                            />
                          </PopoverTrigger>
                          <PopoverContent align="start" className="p-0 w-auto border-[#CBCAC5] bg-white rounded-md shadow-lg">
                            <Calendar mode="single" selected={nextActionDate} onSelect={setNextActionDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="activity-content" className="text-sm font-medium text-[#5E6156] mb-2 block">Activity Details</label>
                      <Textarea
                        id="activity-content"
                        placeholder="Describe the activity..."
                        value={newActivityDescription}
                        onChange={(e) => setNewActivityDescription(e.target.value)}
                        className="min-h-[100px] resize-none border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="add"
                        className="w-full bg-[#2B2521] text-white hover:bg-[#3a322c] rounded-md"
                        onClick={handleLogActivity}
                        disabled={isLoggingActivity || !newActivityDescription.trim()}
                      >
                        {isLoggingActivity ? <LoadingSpinner size={16} className="mr-2" /> : <Activity className="mr-2 h-4 w-4" />}
                        Add Activity
                      </Button>
                    </div>
                  </form>
                </div>
                <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                  <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">Recent Activity</div>
                  {isLoadingLogs ? (
                    <div className="flex items-center justify-center h-32">
                      <LoadingSpinner size={24} />
                      <span className="ml-2 text-muted-foreground">Loading activity...</span>
                    </div>
                  ) : activityLogs.length > 0 ? (
                    <>
                      <div className="relative">
                        <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                          {activityLogs.map((log) => (
                            <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[#F8F7F3] border border-[#E5E3DF] hover:bg-[#EFEDE7] transition-colors">
                              <div className="flex-shrink-0 mt-1">{getUpdateTypeIcon(log.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-[#282828] line-clamp-2">{log.content}</p>
                                  <span className="text-xs text-[#998876] ml-2 font-medium">{format(new Date(log.date), "MMM dd")}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs bg-white border-[#CBCAC5] text-[#5E6156] font-medium">{log.type}</Badge>
                                  {log.nextActionDate && (
                                    <span className="text-xs text-[#4B7B9D] font-medium">Next: {format(parseISO(log.nextActionDate), "MMM dd, yyyy")}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {activityLogs.length > 5 && (
                          <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8" style={{ background: "linear-gradient(to bottom, transparent, #fff 90%)" }} />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center h-full text-[#998876]">
                      <History className="w-12 h-12 mb-2 text-[#E5E3DF]" />
                      <span className="text-base font-medium">No activity yet</span>
                      <span className="text-sm">All your recent activity will appear here.</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 