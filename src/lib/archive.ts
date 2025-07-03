import { supabase } from './supabaseClient';

/**
 * Archive a lead and its related activity logs
 */
export const archiveLead = async (leadId: string, archivedBy: string) => {
  try {
    // First, archive all related update records (activity logs)
    const { error: updateError } = await supabase
      .from("update")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq("lead_id", leadId)
      .eq("is_archived", false);
    
    if (updateError) {
      console.error("Failed to archive related updates:", updateError);
      // Continue anyway, as the lead archiving might still work
    }
    
    // Then archive the lead
    const { error } = await supabase
      .from("lead")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq("id", leadId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to archive lead:", error);
    throw error;
  }
};

/**
 * Archive multiple leads and their related activity logs
 */
export const archiveLeads = async (leadIds: string[], archivedBy: string) => {
  try {
    // First, archive all related update records (activity logs)
    const { error: updateError } = await supabase
      .from("update")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .in("lead_id", leadIds)
      .eq("is_archived", false);
    
    if (updateError) {
      console.error("Failed to archive related updates:", updateError);
      // Continue anyway, as the lead archiving might still work
    }
    
    // Then archive all selected leads
    const { error } = await supabase
      .from("lead")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .in("id", leadIds);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to archive leads:", error);
    throw error;
  }
};

/**
 * Archive an opportunity and its related activity logs
 */
export const archiveOpportunity = async (opportunityId: string, archivedBy: string) => {
  try {
    // First, archive all related update records (activity logs)
    const { error: updateError } = await supabase
      .from("update")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq("opportunity_id", opportunityId)
      .eq("is_archived", false);
    
    if (updateError) {
      console.error("Failed to archive related updates:", updateError);
      // Continue anyway, as the opportunity archiving might still work
    }
    
    // Then archive the opportunity
    const { error } = await supabase
      .from("opportunity")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq("id", opportunityId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to archive opportunity:", error);
    throw error;
  }
};

/**
 * Archive an account, its related opportunities, and activity logs
 */
export const archiveAccount = async (accountId: string, archivedBy: string) => {
  try {
    // First, archive all related update records (activity logs)
    const { error: updateError } = await supabase
      .from("update")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq("account_id", accountId)
      .eq("is_archived", false);
    
    if (updateError) {
      console.error("Failed to archive related updates:", updateError);
      // Continue anyway, as the account archiving might still work
    }
    
    // Then archive all related opportunities
    const { error: opportunityError } = await supabase
      .from("opportunity")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq("account_id", accountId)
      .eq("is_archived", false);
    
    if (opportunityError) {
      console.error("Failed to archive related opportunities:", opportunityError);
      // Continue anyway, as the account archiving might still work
    }
    
    // Finally archive the account
    const { error } = await supabase
      .from("account")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: archivedBy
      })
      .eq("id", accountId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to archive account:", error);
    throw error;
  }
};

/**
 * Restore an archived lead and its related activity logs
 */
export const restoreLead = async (leadId: string, restoredBy: string) => {
  try {
    // First, restore all related update records (activity logs)
    const { error: updateError } = await supabase
      .from("update")
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq("lead_id", leadId)
      .eq("is_archived", true);
    
    if (updateError) {
      console.error("Failed to restore related updates:", updateError);
      // Continue anyway, as the lead restoration might still work
    }
    
    // Then restore the lead
    const { error } = await supabase
      .from("lead")
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq("id", leadId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to restore lead:", error);
    throw error;
  }
};

/**
 * Restore an archived opportunity and its related activity logs
 */
export const restoreOpportunity = async (opportunityId: string, restoredBy: string) => {
  try {
    // First, restore all related update records (activity logs)
    const { error: updateError } = await supabase
      .from("update")
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq("opportunity_id", opportunityId)
      .eq("is_archived", true);
    
    if (updateError) {
      console.error("Failed to restore related updates:", updateError);
      // Continue anyway, as the opportunity restoration might still work
    }
    
    // Then restore the opportunity
    const { error } = await supabase
      .from("opportunity")
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq("id", opportunityId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to restore opportunity:", error);
    throw error;
  }
};

/**
 * Restore an archived account, its related opportunities, and activity logs
 */
export const restoreAccount = async (accountId: string, restoredBy: string) => {
  try {
    // First, restore all related update records (activity logs)
    const { error: updateError } = await supabase
      .from("update")
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq("account_id", accountId)
      .eq("is_archived", true);
    
    if (updateError) {
      console.error("Failed to restore related updates:", updateError);
      // Continue anyway, as the account restoration might still work
    }
    
    // Then restore all related opportunities
    const { error: opportunityError } = await supabase
      .from("opportunity")
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq("account_id", accountId)
      .eq("is_archived", true);
    
    if (opportunityError) {
      console.error("Failed to restore related opportunities:", opportunityError);
      // Continue anyway, as the account restoration might still work
    }
    
    // Finally restore the account
    const { error } = await supabase
      .from("account")
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null
      })
      .eq("id", accountId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to restore account:", error);
    throw error;
  }
}; 