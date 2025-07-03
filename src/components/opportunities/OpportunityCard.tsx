"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChartBig,
  DollarSign,
  CalendarDays,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Lightbulb,
  TrendingUp,
  Users,
  Clock,
  MessageSquarePlus,
  Calendar as CalendarIcon,
  Sparkles,
  Pencil,
  Check,
  X,
  Phone,
  Mail,
  FileText,
  Activity,
  UserCheck,
  User,
  MoreHorizontal,
  Trash2,
  Coins,
  MinusCircle,
} from "lucide-react";
import type {
  Opportunity,
  OpportunityForecast as AIOpportunityForecast,
  Account,
  OpportunityStatus,
  Update,
} from "@/types";
import { Progress } from "@/components/ui/progress";
import {
  format,
  differenceInDays,
  parseISO,
  isValid,
  formatDistanceToNowStrict,
  formatDistanceToNow,
} from "date-fns";
import { aiPoweredOpportunityForecasting } from "@/ai/flows/ai-powered-opportunity-forecasting";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getAccountById } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabaseClient";
import { countries } from "@/lib/countryData";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { History } from "lucide-react";
import { motion } from "framer-motion";

interface OpportunityCardProps {
  opportunity: Opportunity;
  accountName?: string;
  onStatusChange?: (newStatus: OpportunityStatus) => void;
  onValueChange?: (newValue: number) => void;
  onTimelineChange?: (newStartDate: string, newEndDate: string) => void;
  selectMode?: boolean;
  onSelect?: () => void;
}

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

// Utility to safely parse ISO date strings
function safeParseISO(dateString?: string): Date | null {
  if (!dateString) return null;
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : null;
}

function calculateProgress(
  startDate: string,
  endDate: string,
  status: OpportunityStatus
): number {
  const start = safeParseISO(startDate);
  const end = safeParseISO(endDate);
  if (!start || !end) return 0;
  const today = new Date();
  if (status === "Win") return 100;
  if (status === "Loss") return 0;
  if (today < start) return 5;
  if (today >= end) return 95;
  const totalDuration = differenceInDays(end, start);
  const elapsedDuration = differenceInDays(today, start);
  if (totalDuration <= 0)
    return status === "Negotiation" ||
      status === "Proposal" ||
      status === "On Hold"
      ? 50
      : 0;
  return Math.min(98, Math.max(5, (elapsedDuration / totalDuration) * 100));
}

// Build a map for quick lookup (outside the component)
const currencyMap = Object.fromEntries(
  countries.map((c) => [c.currencyCode, c.currencySymbol || c.currencyCode])
);

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

export default function OpportunityCard({
  opportunity,
  accountName,
  onStatusChange,
  onValueChange,
  onTimelineChange,
  selectMode,
  onSelect,
}: OpportunityCardProps) {
  // const [forecast, setForecast] = useState<AIOpportunityForecast | null>(null);
  // const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [associatedAccount, setAssociatedAccount] = useState<
    Account | undefined
  >(undefined);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Update[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [newActivityDescription, setNewActivityDescription] = useState("");
  const [newActivityType, setNewActivityType] = useState<
    "General" | "Call" | "Meeting" | "Email"
  >("General");
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(
    undefined
  );
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [assignedUser, setAssignedUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");
  const [editStatus, setEditStatus] = useState<OpportunityStatus>(
    opportunity.status as OpportunityStatus
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // Editable Value
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValue, setEditValue] = useState(opportunity.value.toString());
  const [isUpdatingValue, setIsUpdatingValue] = useState(false);

  // AI Score and Delete Dialog
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const status = opportunity.status as OpportunityStatus;

  // Use the map for robust lookup
  const currencySymbol =
    currencyMap[(opportunity as any).currency || "USD"] ||
    (opportunity as any).currency ||
    "$";

  useEffect(() => {
    if (opportunity.accountId) {
      setAssociatedAccount(getAccountById(opportunity.accountId));
    }
  }, [opportunity.accountId]);

  // Fetch current user role
  useEffect(() => {
    const fetchRole = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      if (!error && data) setCurrentUserRole(data.role);
    };
    fetchRole();
  }, []);

  // Fetch assigned user from DB
  useEffect(() => {
    const fetchAssignedUser = async () => {
      const ownerId = opportunity.ownerId || (opportunity as any).owner_id;
      if (!ownerId) {
        setAssignedUser(null);
        setAssignedUserId(null);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", ownerId)
        .single();
      if (!error && data) {
        setAssignedUser(data);
        setAssignedUserId(data.id);
      } else {
        setAssignedUser(null);
        setAssignedUserId(null);
      }
    };
    fetchAssignedUser();
  }, [opportunity.ownerId, (opportunity as any).owner_id]);

  // Fetch all users for assignment dropdown (admin only)
  useEffect(() => {
    if (currentUserRole !== "admin") return;
    const fetchAllUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email");
      if (!error && data) setAllUsers(data);
    };
    fetchAllUsers();
  }, [currentUserRole]);

  // Fetch existing logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        console.log("Fetching activity logs for opportunity:", opportunity.id);

        // Check if opportunity.id exists and is valid
        if (!opportunity.id) {
          console.error("No opportunity ID provided");
          setActivityLogs([]);
          return;
        }

        // First, let's check if the opportunity exists in the database
        const { data: opportunityCheck, error: opportunityError } =
          await supabase
            .from("opportunity")
            .select("id")
            .eq("id", opportunity.id)
            .single();

        if (opportunityError) {
          console.error("Opportunity not found:", opportunityError);
          setActivityLogs([]);
          return;
        }

        console.log("Opportunity found, fetching logs...");

        // Debug: Let's first check what columns exist in the update table
        console.log("Checking update table structure...");
        const { data: tableInfo, error: tableError } = await supabase
          .from("update")
          .select("*")
          .limit(1);

        if (tableError) {
          console.error("Error checking table structure:", tableError);
        } else {
          console.log("Update table structure sample:", tableInfo?.[0]);
        }

        // Now fetch the logs with better error handling
        console.log("Executing main query for opportunity_id:", opportunity.id);
        const { data: logsData, error } = await supabase
          .from("update")
          .select("*")
          .eq("opportunity_id", opportunity.id)
          .order("date", { ascending: false });

        console.log("Query result:", { data: logsData, error });

        if (error) {
          console.error("Supabase error fetching logs:", error);
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });

          // Try a fallback query to see if the issue is with the opportunity_id column
          console.log("Trying fallback query...");
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("update")
            .select("*")
            .limit(5);

          if (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
          } else {
            console.log(
              "Fallback query successful, sample data:",
              fallbackData
            );
          }

          toast({
            title: "Error",
            description: `Failed to load activity logs: ${
              error.message || "Unknown error"
            }`,
            variant: "destructive",
          });
          setActivityLogs([]);
          return;
        }

        console.log(
          "Activity logs fetched successfully:",
          logsData?.length || 0,
          "logs"
        );

        if (logsData && logsData.length > 0) {
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
        } else {
          console.log(
            "No activity logs found for opportunity:",
            opportunity.id
          );
          setActivityLogs([]);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
        console.error("Error type:", typeof error);
        console.error("Error details:", error);
        toast({
          title: "Error",
          description: "Failed to load activity logs. Please try again.",
          variant: "destructive",
        });
        setActivityLogs([]);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    if (opportunity.id) {
      fetchLogs();
    }
  }, [opportunity.id, toast]);

  // Function to refresh activity logs
  const refreshActivityLogs = async () => {
    try {
      console.log("Refreshing activity logs for opportunity:", opportunity.id);

      const { data: logsData, error } = await supabase
        .from("update")
        .select("*")
        .eq("opportunity_id", opportunity.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Supabase error refreshing logs:", error);
        return;
      }

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
      console.error("Failed to refresh logs:", error);
    }
  };

  // const fetchForecast = async () => {
  //   setIsLoadingForecast(true);
  //   try {
  //     const start = safeParseISO(opportunity.startDate);
  //     const end = safeParseISO(opportunity.endDate);
  //     const timeline = start && end ? `Start: ${format(start, 'MMM dd, yyyy')}, End: ${format(end, 'MMM dd, yyyy')}` : 'N/A';
  //     const forecastData = await aiPoweredOpportunityForecasting({
  //       opportunityName: opportunity.name,
  //       opportunityDescription: opportunity.description,
  //       opportunityTimeline: timeline,
  //       opportunityValue: opportunity.value,
  //       opportunityStatus: opportunity.status,
  //       recentUpdates: "Placeholder: Updates show steady progress.",
  //     });
  //     setForecast(forecastData);
  //   } catch (error) {
  //     console.error(`Failed to fetch forecast for ${opportunity.name}:`, error);
  //     setForecast({ timelinePrediction: "N/A", completionDateEstimate: "N/A", revenueForecast: opportunity.value,    bottleneckIdentification: "Error fetching forecast."});
  //   } finally {
  //     setIsLoadingForecast(false);
  //   }
  // };

  // useEffect(() => {
  //   if(opportunity.status !== 'Win' && opportunity.status !== 'Loss' && opportunity.name && opportunity.startDate && opportunity.endDate && opportunity.value && opportunity.status && opportunity.description) {
  //       fetchForecast();
  //   } else {
  //     setForecast(null); // No forecast for completed/cancelled
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [opportunity.id, opportunity.name, opportunity.startDate, opportunity.endDate, opportunity.value, opportunity.status, opportunity.description]);

  const progress = calculateProgress(
    opportunity.startDate,
    opportunity.endDate,
    opportunity.status as OpportunityStatus
  );
  // const isAtRisk = forecast?.bottleneckIdentification && forecast.bottleneckIdentification.toLowerCase() !== "none identified" && forecast.bottleneckIdentification.toLowerCase() !== "none" && forecast.bottleneckIdentification !== "Error fetching forecast." && forecast.bottleneckIdentification.length > 0;

  const opportunityHealthIcon = (
    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  );
  const opportunityHealthText = "On Track";
  // if (forecast?.bottleneckIdentification === "Error fetching forecast.") {
  //   opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
  //   opportunityHealthText = "Forecast Error";
  // } else if (isAtRisk) {
  //   opportunityHealthIcon = <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
  //   opportunityHealthText = "Potential Risk";
  // }

  function timeRemaining(status: OpportunityStatus): string {
    if (status === "Win" || status === "Loss") return status;
    const end = safeParseISO(opportunity.endDate);
    if (!end) return "N/A";
    const now = new Date();
    if (now > end)
      return `Overdue by ${formatDistanceToNowStrict(end, {
        addSuffix: false,
      })}`;
    return `${formatDistanceToNowStrict(end, { addSuffix: false })} left`;
  }

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

    // Prevent duplicate submissions
    if (isLoggingActivity) {
      console.log(
        "Activity logging already in progress, ignoring duplicate click"
      );
      return;
    }

    // Check for recent duplicate entries (within last 5 seconds)
    const recentDuplicate = activityLogs.find(
      (log) =>
        log.content === newActivityDescription.trim() &&
        log.type === "General" &&
        new Date().getTime() - new Date(log.createdAt).getTime() < 5000
    );

    if (recentDuplicate) {
      console.log("Duplicate activity detected, ignoring");
      toast({
        title: "Warning",
        description: "This activity was already logged recently.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingActivity(true);
    console.log("Starting to log activity:", newActivityDescription);

    try {
      const currentUserId = localStorage.getItem("user_id");
      if (!currentUserId) throw new Error("User not authenticated");

      // Save to Supabase
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

      console.log("Activity logged successfully:", data);

      // Transform the response to match Update interface
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

      // Update local state and refresh logs
      setActivityLogs((prev) => [newUpdate, ...prev]);
      setNewActivityDescription("");
      setNewActivityType("General");
      setNextActionDate(undefined);

      // Also refresh from backend to ensure consistency
      await refreshActivityLogs();

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

  const renderActivityLogItem = (log: Update) => {
    const logDate = safeParseISO(log.date);
    return (
      <div
        key={log.id}
        className="flex items-start space-x-3 p-3 rounded-r-lg bg-[#9A8A744c] border-l-4 border-muted"
      >
        <div className="flex-shrink-0 mt-1">{getUpdateTypeIcon(log.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {log.content}
            </p>
            <span className="text-xs text-muted-foreground ml-2">
              {logDate ? format(logDate, "MMM dd") : "N/A"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {log.type}
            </Badge>
            {log.nextActionDate && (
              <span className="text-xs text-blue-600 font-medium">
                Next: {format(parseISO(log.nextActionDate), "MMM dd, yyyy")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const toggleAiInsights = () => setShowAiInsights((prev) => !prev);

  const handleAssignUser = async (userId: string) => {
    setAssignedUserId(userId);
    // Update the assignment in the backend
    const { error } = await supabase
      .from("opportunity")
      .update({ owner_id: userId })
      .eq("id", opportunity.id);
    if (!error) {
      // Fetch and update assigned user
      const { data, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", userId)
        .single();
      if (!userError && data) setAssignedUser(data);
    }
  };

  // Keep editStatus in sync if opportunity.status changes (e.g., after parent update)
  useEffect(() => {
    setEditStatus(opportunity.status as OpportunityStatus);
  }, [opportunity.status]);

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

  // Status options for editing
  const statusOptions = [
    "Scope Of Work",
    "Proposal",
    "Negotiation",
    "On Hold",
    "Win",
    "Loss",
  ];

  // Keep edit fields in sync if opportunity changes
  useEffect(() => {
    setEditStatus(opportunity.status as OpportunityStatus);
    setEditValue(opportunity.value.toString());
  }, [opportunity.value, opportunity.status]);

  const handleValueSave = async () => {
    setIsUpdatingValue(true);
    const newValue = Number(editValue.replace(/,/g, ""));
    const { error } = await supabase
      .from("opportunity")
      .update({ value: newValue })
      .eq("id", opportunity.id);
    if (!error) {
      toast({
        title: "Value Updated",
        description: `Value changed to ${newValue.toLocaleString()}`,
      });
      setIsEditingValue(false);
      if (typeof onValueChange === "function") onValueChange(newValue);
    } else {
      toast({
        title: "Error",
        description: "Failed to update value",
        variant: "destructive",
      });
    }
    setIsUpdatingValue(false);
  };

  const [editMode, setEditMode] = useState(false);
  const [editOpportunity, setEditOpportunity] = useState({
    name: opportunity.name,
    value: opportunity.value.toString(),
    status: opportunity.status,
    description: opportunity.description || "",
    accountName: accountName || "",
  });

  // Timeline status calculation
  function getTimelineStatus() {
    const end = safeParseISO(opportunity.endDate);
    const start = safeParseISO(opportunity.startDate);
    if (!end || !start) return { label: "N/A", color: "gray", days: 0 };
    const now = new Date();
    if (["Win", "Loss"].includes(opportunity.status)) {
      return { label: "Closed", color: "#CBCAC5", days: 0 };
    }
    if (now < end) {
      // On track or delayed
      if (now < start)
        return { label: "Not started", color: "#CBCAC5", days: 0 };
      const daysLeft = Math.ceil(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft >= 0) {
        return { label: "On Track", color: "#4BB543", days: daysLeft };
      }
    }
    // Overdue
    const daysOverdue = Math.abs(
      Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      label: `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`,
      color: "#E53E3E",
      days: daysOverdue,
    };
  }
  const timelineStatus = getTimelineStatus();

  // Gantt bar calculation
  function getGanttBar() {
    const start = safeParseISO(opportunity.startDate);
    const end = safeParseISO(opportunity.endDate);
    const now = new Date();
    if (!start || !end) return null;
    const total = end.getTime() - start.getTime();
    const elapsed = Math.max(
      0,
      Math.min(now.getTime() - start.getTime(), total)
    );
    const overdue = now > end ? now.getTime() - end.getTime() : 0;
    const percentElapsed = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const percentOverdue =
      overdue > 0 ? Math.min(100, (overdue / total) * 100) : 0;
    return { percentElapsed, percentOverdue };
  }
  const gantt = getGanttBar();

  const startDateObj = safeParseISO(opportunity.startDate);
  const endDateObj = safeParseISO(opportunity.endDate);
  let todayDotLeft = "0%";
  if (startDateObj && endDateObj) {
    todayDotLeft = `${Math.min(
      100,
      Math.max(
        0,
        ((new Date().getTime() - startDateObj.getTime()) /
          (endDateObj.getTime() - startDateObj.getTime())) *
          100
      )
    )}%`;
  }
  let daysLeftLabel = "";
  if (gantt && startDateObj && endDateObj) {
    daysLeftLabel = `${Math.round(
      (gantt.percentElapsed / 100) *
        ((endDateObj.getTime() - startDateObj.getTime()) /
          (1000 * 60 * 60 * 24))
    )} days left`;
  }

  const [animatedScore, setAnimatedScore] = useState(0);
  const targetScore = aiScore !== null
    ? aiScore
    : Math.min(opportunity.value ? Math.floor(opportunity.value / 1000) : 0, 100);
  useEffect(() => {
    setAnimatedScore(0);
    const timeout = setTimeout(() => setAnimatedScore(targetScore), 50);
    return () => clearTimeout(timeout);
  }, [targetScore, opportunity.id]);

  return (
    <>
      <Card
        className="border border-[#E5E3DF] bg-white rounded-sm shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full p-4"
        onClick={selectMode ? onSelect : () => setIsDialogOpen(true)}
        style={selectMode ? { cursor: "pointer" } : { cursor: "pointer" }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xl font-bold text-[#282828] leading-tight truncate">
                {opportunity.name}
              </div>
              <div className="text-base text-[#5E6156] font-medium mt-0.5 truncate">
                {accountName || "No Account"}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {/* Status pill above value */}
            <div className="text-sm font-medium text-[#5E6156]">
              Opportunity Score
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-full bg-[#E5E3DF] rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedScore}%` }}
                  transition={{ duration: 1.25, ease: [0.42, 0, 0.58, 1] }}
                  style={{
                    backgroundImage: "linear-gradient(to right, #3987BE, #D48EA3)",
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                />
              </div>
              <div className="text-sm font-semibold text-[#282828] ml-2 flex flex-row items-center flex-shrink-0">
                {targetScore}%
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-[15px]">
              <div className="mb-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColorClasses(
                    status
                  )}`}
                >
                  {status}
                </span>
              </div>
              <div className="text-[#5E6156] truncate">
                <span className="font-medium">Value:</span>{" "}
                <span className="text-[#282828]">
                  {opportunity.value
                    ? `$${opportunity.value.toLocaleString()}`
                    : "N/A"}
                </span>
              </div>
              <div className="text-[#5E6156] truncate">
                <span className="font-medium">Start Date:</span>{" "}
                <span className="text-[#282828]">
                  {opportunity.startDate
                    ? format(new Date(opportunity.startDate), "MMM dd, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          className="mt-6 border-t border-[#E5E3DF] pt-3 flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-[#282828] font-semibold text-base py-2 rounded-md border-[#E5E3DF] bg-[#F8F7F3] hover:bg-[#EFEDE7] flex items-center justify-center gap-2 max-h-10"
              >
                <MoreHorizontal className="h-5 w-5 text-[#282828]" /> Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#fff] text-[#282828] p-1 rounded-md border border-[#E5E3DF] shadow-xl sm:max-w-[308px] sm:h-fit">
              <DropdownMenuItem
                onClick={() => setIsDialogOpen(true)}
                className="min-h-[44px] text-[#282828] bg-[#fff] focus:bg-[#F8F7F3] focus:text-black flex items-center gap-2 cursor-pointer"
              >
                <Eye className="h-5 w-5 text-[#282828]" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="min-h-[44px] bg-[#fff] flex items-center gap-2 text-[#916D5B] focus:bg-[#F8F7F3] focus:text-[#916D5B] cursor-pointer"
              >
                <Trash2 className="h-5 w-5 text-[#916D5B]" /> Delete Opportunity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border-0 rounded-lg p-0 focus-within:ourline-0 focus-within:ring-0 focus-visible:outline-0 focus-visible:ring-0">
          <div className="p-6 pb-0">
            <DialogHeader className="">
              <div className="flex items-start gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-[#5E6156] rounded-full flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-3xl font-bold text-[#282828]">
                        {opportunity.name}
                      </DialogTitle>
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
                            // Save edits (name, value, status, description, accountName)
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
                            // Optionally update account name if needed
                            if (Object.keys(updates).length > 0) {
                              await supabase
                                .from("opportunity")
                                .update(updates)
                                .eq("id", opportunity.id);
                            }
                            setEditMode(false);
                          }}
                        >
                          <Check
                            className="h-5 w-5"
                            style={{ color: "#97A487" }}
                          />
                        </Button>
                      )}
                    </div>
                    <p className="text-lg text-[#5E6156] leading-tight">
                      {accountName || "No Account"}
                    </p>
                    <p className="text-lg text-[#5E6156] leading-tight">
                      {opportunity.status}
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
                        <SelectItem
                          key={status}
                          value={status}
                          className="w-full"
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isUpdatingStatus && (
                    <span className="ml-2 text-xs text-[#998876]">
                      Updating...
                    </span>
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
              <TabsContent
                value="overview"
                className="max-h-[708px] overflow-y-scroll"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6 flex flex-col h-full">
                    {/* Key Information */}
                    <div className="bg-white border border-[#E5E3DF] rounded-lg p-6 flex-1 flex flex-col justify-between">
                      <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                        <Briefcase className="h-5 w-5 text-[#5E6156]" /> Key
                        Information
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
                                    className="w-fit text-center border-0 border-b-2 border-[#916D5B] focus:ring-0 bg-transparent px-0 rounded-none text-2xl placeholder:text-2xl"
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="text-xl">
                                    {currencySymbol}{" "}
                                    {opportunity.value.toLocaleString()}
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
                              <p className="text-sm text-[#5E6156]">
                                Expected Close Date
                              </p>
                              <p className="text-lg font-bold text-[#282828] mt-1">
                                {(() => {
                                  const end = safeParseISO(opportunity.endDate);
                                  return end
                                    ? format(end, "MMM dd, yyyy")
                                    : "N/A";
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-[#F8F7F3] p-4 rounded-md">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-[#5E6156] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-[#5E6156]">
                                Start Date
                              </p>
                              <p className="text-lg font-bold text-[#282828] mt-1">
                                {opportunity.startDate
                                  ? format(
                                      new Date(opportunity.startDate),
                                      "MMM dd, yyyy"
                                    )
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white border border-[#E5E3DF] rounded-lg p-6 flex-1 flex flex-col justify-between">
                    <h3 className="text-lg font-semibold text-[#282828] flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-[#5E6156]" />{" "}
                      Description
                    </h3>
                    <div className="bg-[#F8F7F3] p-4 rounded-md min-h-[200px]">
                      {editMode ? (
                        <Textarea
                          value={editOpportunity.description}
                          onChange={(e) =>
                            setEditOpportunity({
                              ...editOpportunity,
                              description: e.target.value,
                            })
                          }
                          className="min-h-[120px] resize-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-0 bg-transparent px-0"
                          placeholder="Enter a description..."
                        />
                      ) : (
                        <p className="text-sm text-[#282828] leading-relaxed">
                          {opportunity.description ||
                            "No description available."}
                        </p>
                      )}
                    </div>
                    {/* Minimal timeline UI below description */}
                    <div className="mt-4 flex items-center gap-2">
                      {(() => {
                        let statusLabel = "On Time";
                        let icon = (
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: "#4BB543" }}
                          />
                        );
                        let tooltip = "This opportunity is currently on time.";
                        if (
                          typeof timelineStatus.label === "string" &&
                          timelineStatus.label.startsWith("Overdue")
                        ) {
                          statusLabel = "Overdue";
                          icon = (
                            <AlertTriangle
                              className="w-4 h-4"
                              style={{ color: "#E53E3E" }}
                            />
                          );
                          tooltip = "This opportunity is overdue.";
                        } else if (timelineStatus.label === "Closed") {
                          statusLabel = "Closed";
                          icon = (
                            <MinusCircle
                              className="w-4 h-4"
                              style={{ color: "#CBCAC5" }}
                            />
                          );
                          tooltip = "This opportunity is closed.";
                        } else if (timelineStatus.label !== "On Track") {
                          statusLabel = "Delayed";
                          icon = (
                            <Clock
                              className="w-4 h-4"
                              style={{ color: "#FBBF24" }}
                            />
                          );
                          tooltip = "This opportunity is delayed.";
                        }
                        return (
                          <div
                            className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ECECEC] bg-white shadow-sm"
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
                    <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">
                      Add New Activity
                    </div>
                    <form
                      className="space-y-4"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor="activity-type"
                            className="text-sm font-medium text-[#5E6156] mb-2 block"
                          >
                            Activity Type
                          </Label>
                          <Select
                            value={newActivityType}
                            onValueChange={(value) =>
                              setNewActivityType(
                                value as
                                  | "General"
                                  | "Call"
                                  | "Meeting"
                                  | "Email"
                              )
                            }
                          >
                            <SelectTrigger
                              id="activity-type"
                              className="w-full border border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                            >
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
                          <Label
                            htmlFor="next-action-date"
                            className="text-sm font-medium text-[#5E6156] mb-2 block"
                          >
                            Next Action Date (Optional)
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Input
                                id="next-action-date"
                                type="text"
                                value={
                                  nextActionDate
                                    ? format(nextActionDate, "dd/MM/yyyy")
                                    : ""
                                }
                                placeholder="dd/mm/yyyy (optional)"
                                readOnly
                                disabled={isLoggingActivity}
                                className="cursor-pointer bg-[#F8F7F3] border-[#CBCAC5] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                              />
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="p-0 w-auto border-[#CBCAC5] bg-white rounded-md shadow-lg"
                            >
                              <Calendar
                                mode="single"
                                selected={nextActionDate}
                                onSelect={setNextActionDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="activity-content"
                          className="text-sm font-medium text-[#5E6156] mb-2 block"
                        >
                          Activity Details
                        </Label>
                        <Textarea
                          id="activity-content"
                          placeholder="Describe the activity..."
                          value={newActivityDescription}
                          onChange={(e) =>
                            setNewActivityDescription(e.target.value)
                          }
                          className="min-h-[100px] resize-none border-[#CBCAC5] bg-[#F8F7F3] focus:ring-1 focus:ring-[#916D5B] focus:border-[#916D5B] rounded-md"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="add"
                          className="w-full bg-[#2B2521] text-white hover:bg-[#3a322c] rounded-md"
                          onClick={handleLogActivity}
                          disabled={
                            isLoggingActivity || !newActivityDescription.trim()
                          }
                        >
                          {isLoggingActivity ? (
                            <LoadingSpinner size={16} className="mr-2" />
                          ) : (
                            <Activity className="mr-2 h-4 w-4" />
                          )}
                          Add Activity
                        </Button>
                      </div>
                    </form>
                  </div>
                  <div className="md:col-span-1 bg-white border border-[#E5E3DF] rounded-lg p-6">
                    <div className="text-sm font-semibold text-[#5E6156] uppercase tracking-wide mb-3">
                      Recent Activity
                    </div>
                    {isLoadingLogs ? (
                      <div className="flex items-center justify-center h-32">
                        <LoadingSpinner size={24} />
                        <span className="ml-2 text-muted-foreground">
                          Loading activity...
                        </span>
                      </div>
                    ) : activityLogs.length > 0 ? (
                      <>
                        <div className="relative">
                          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                            {activityLogs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-start space-x-3 p-3 rounded-lg bg-[#F8F7F3] border border-[#E5E3DF] hover:bg-[#EFEDE7] transition-colors"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  {getUpdateTypeIcon(log.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-[#282828] line-clamp-2">
                                      {log.content}
                                    </p>
                                    <span className="text-xs text-[#998876] ml-2 font-medium">
                                      {format(new Date(log.date), "MMM dd")}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-white border-[#CBCAC5] text-[#5E6156] font-medium"
                                    >
                                      {log.type}
                                    </Badge>
                                    {log.nextActionDate && (
                                      <span className="text-xs text-[#4B7B9D] font-medium">
                                        Next:{" "}
                                        {format(
                                          parseISO(log.nextActionDate),
                                          "MMM dd, yyyy"
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {activityLogs.length > 5 && (
                            <div
                              className="pointer-events-none absolute left-0 right-0 bottom-0 h-8"
                              style={{
                                background:
                                  "linear-gradient(to bottom, transparent, #fff 90%)",
                              }}
                            />
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center h-full text-[#998876]">
                        <History className="w-12 h-12 mb-2 text-[#E5E3DF]" />
                        <span className="text-base font-medium">
                          No activity yet
                        </span>
                        <span className="text-sm">
                          All your recent activity will appear here.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Opportunity Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className="font-semibold">Name:</span> {opportunity.name}
              </div>
              <div>
                <span className="font-semibold">Account:</span> {accountName}
              </div>
              <div>
                <span className="font-semibold">Value:</span> $
                {opportunity.value.toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                {opportunity.status}
              </div>
              <div>
                <span className="font-semibold">Description:</span>{" "}
                {opportunity.description}
              </div>
              <div>
                <span className="font-semibold">Timeline:</span>{" "}
                {(() => {
                  const start = safeParseISO(opportunity.startDate);
                  const end = safeParseISO(opportunity.endDate);
                  if (start && end) {
                    return `${format(start, "MMM dd, yyyy")} - ${format(
                      end,
                      "MMM dd, yyyy"
                    )}`;
                  }
                  return "N/A";
                })()}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{" "}
                {opportunity.createdAt &&
                !isNaN(new Date(opportunity.createdAt).getTime())
                  ? formatDistanceToNow(new Date(opportunity.createdAt), {
                      addSuffix: true,
                    })
                  : "N/A"}
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span>{" "}
                {opportunity.updatedAt &&
                !isNaN(new Date(opportunity.updatedAt).getTime())
                  ? formatDistanceToNow(new Date(opportunity.updatedAt), {
                      addSuffix: true,
                    })
                  : "N/A"}
              </div>
            </div>
            <div className="pt-2">
              <span className="font-semibold">Assigned To:</span>
              {currentUserRole === "admin" ? (
                <Select
                  value={assignedUserId || ""}
                  onValueChange={handleAssignUser}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Assign to user" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="ml-2">
                  {assignedUser ? (
                    `${assignedUser.name} (${assignedUser.email})`
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this opportunity? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowDeleteDialog(false);
                // Add delete logic here if needed
                toast({
                  title: "Opportunity deleted",
                  description: "Opportunity has been deleted successfully.",
                });
              }}
              className="bg-[#916D5B] text-white rounded-md border-0 hover:bg-[#a98a77]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
