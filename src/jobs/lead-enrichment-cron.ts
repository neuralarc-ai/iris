import 'dotenv/config';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { leadEnrichmentFlow } from '../ai/flows/lead-enrichment';
import { v4 as uuidv4 } from 'uuid';
import { getDelayBetweenLeads, shouldSkipLead, CRON_CONFIG } from '@/lib/cron-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_KEY!
);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processLead(lead: any, user: any, company: any) {
  try {
    console.log(`🔄 Processing lead: ${lead.company_name} (${lead.id})`);
    
    // Check for existing analysis in last 24h
    const { data: existing } = await supabase
      .from('aianalysis')
      .select('*')
      .eq('entity_type', 'Lead')
      .eq('entity_id', lead.id)
      .eq('analysis_type', 'enrichment')
      .eq('status', 'success')
      .order('last_refreshed_at', { ascending: false })
      .limit(1)
      .single();
      
    if (shouldSkipLead(existing?.last_refreshed_at)) {
      const hoursSinceAnalysis = existing?.last_refreshed_at ? 
        ((Date.now() - new Date(existing.last_refreshed_at).getTime()) / (1000 * 60 * 60)).toFixed(1) : '0';
      console.log(`⏭️ Skipping ${lead.company_name} - analyzed ${hoursSinceAnalysis} hours ago`);
      return;
    }
    
    // Mark job as processing
    await supabase.from('lead_analysis_job').upsert({
      lead_id: lead.id,
      status: 'processing',
      updated_at: new Date().toISOString(),
    }, { onConflict: ['lead_id'] });
    
    // Fetch Tavily/website summaries if needed (reuse logic from API route if required)
    // For now, skip Tavily/website summaries for simplicity
    const aiResult = await leadEnrichmentFlow({ lead, user, company });
    
    await supabase.from('aianalysis').insert([
      {
        id: uuidv4(),
        entity_type: 'Lead',
        entity_id: lead.id,
        analysis_type: 'enrichment',
        content: aiResult.pitchNotes,
        match_score: aiResult.leadScore,
        recommended_services: aiResult.recommendations,
        use_case: aiResult.useCase,
        pitch_notes: aiResult.pitchNotes,
        ai_output: aiResult,
        status: 'success',
        last_refreshed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    
    await supabase.from('lead_analysis_job').upsert({
      lead_id: lead.id,
      status: 'success',
      updated_at: new Date().toISOString(),
    }, { onConflict: ['lead_id'] });
    
    console.log(`✅ Successfully processed ${lead.company_name}`);
    
  } catch (e: any) {
    console.error(`❌ Error processing lead ${lead.company_name}:`, e);
    
    // Save error to database
    await supabase.from('lead_analysis_job').upsert({
      lead_id: lead.id,
      status: 'error',
      error_message: e.message,
      updated_at: new Date().toISOString(),
    }, { onConflict: ['lead_id'] });
    
    // Also save error to aianalysis table
    await supabase.from('aianalysis').upsert({
      entity_type: 'Lead',
      entity_id: lead.id,
      analysis_type: 'enrichment',
      status: 'error',
      error_message: e.message,
      last_refreshed_at: new Date().toISOString(),
    });
  }
}

async function runLeadEnrichmentCron() {
  console.log('🚀 Starting lead enrichment cron job...');
  
  try {
    // Fetch all leads
    const { data: leads, error: leadError } = await supabase.from('lead').select('*');
    if (leadError) {
      console.error('❌ Error fetching leads:', leadError);
      return;
    }
    
    console.log(`📊 Found ${leads.length} leads to process`);
    
    // Fetch company info
    const { data: company } = await supabase.from('company').select('*, services:company_service(*)').single();
    
    // Fetch a default admin user (for context)
    const { data: user } = await supabase.from('users').select('*').eq('role', 'admin').limit(1).single();
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const lead of leads) {
      try {
        await processLead(lead, user, company);
        processedCount++;
      } catch (error) {
        console.error(`❌ Failed to process lead ${lead.company_name}:`, error);
        errorCount++;
      }
      
      // Wait between leads to avoid rate limits
      if (leads.indexOf(lead) < leads.length - 1) {
        const delay = getDelayBetweenLeads();
        console.log(`⏳ Waiting ${delay / 1000} seconds before next lead...`);
        await sleep(delay);
      }
    }
    
    console.log(`🎉 Lead enrichment cron job complete. Processed: ${processedCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
  }
}

// Schedule to run every hour
cron.schedule('0 * * * *', runLeadEnrichmentCron);

// Also run immediately if executed directly
if (require.main === module) {
  runLeadEnrichmentCron();
} 