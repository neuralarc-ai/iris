import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { leadEnrichmentFlow } from '@/ai/flows/lead-enrichment';
import { getDelayBetweenLeads, shouldSkipLead, CRON_CONFIG } from '@/lib/cron-config';

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    // Vercel automatically adds the CRON_SECRET to the Authorization header
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting lead enrichment cron job...');

    // Get job status
    const { data: jobStatus } = await supabase
      .from('lead_analysis_job')
      .select('*')
      .eq('job_name', 'lead_enrichment_cron')
      .single();

    if (jobStatus?.status === 'running') {
      console.log('⚠️ Job already running, skipping...');
      return NextResponse.json({ 
        message: 'Job already running', 
        status: 'skipped' 
      });
    }

    // Update job status to running
    await supabase
      .from('lead_analysis_job')
      .upsert({
        job_name: 'lead_enrichment_cron',
        status: 'running',
        started_at: new Date().toISOString(),
        last_run: new Date().toISOString()
      });

    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from('lead')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    console.log(`📊 Found ${leads.length} leads to process`);

    // Fetch company info
    const { data: companyData } = await supabase
      .from('company')
      .select('*')
      .single();

    // Fetch default admin user for context
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .single();

    let processedCount = 0;
    let errorCount = 0;

    // Process leads sequentially to avoid rate limits
    for (const lead of leads) {
      try {
        console.log(`🔄 Processing lead: ${lead.company_name} (${lead.id})`);

        // Check if already analyzed recently (within 24 hours)
        const { data: existingAnalysis } = await supabase
          .from('aianalysis')
          .select('last_refreshed_at')
          .eq('entity_type', 'Lead')
          .eq('entity_id', lead.id)
          .eq('analysis_type', 'enrichment')
          .eq('status', 'success')
          .order('last_refreshed_at', { ascending: false })
          .limit(1)
          .single();

        if (shouldSkipLead(existingAnalysis?.last_refreshed_at)) {
          const hoursSinceRefresh = existingAnalysis?.last_refreshed_at ? 
            ((Date.now() - new Date(existingAnalysis.last_refreshed_at).getTime()) / (1000 * 60 * 60)).toFixed(1) : '0';
          console.log(`⏭️ Skipping ${lead.company_name} - analyzed ${hoursSinceRefresh} hours ago`);
          continue;
        }

        // Run AI enrichment
        const enrichmentResult = await leadEnrichmentFlow({
          lead: {
            id: lead.id,
            companyName: lead.company_name || '',
            personName: lead.person_name || '',
            email: lead.email || '',
            phone: lead.phone || '',
            linkedinProfileUrl: lead.linkedin_profile_url || '',
            country: lead.country || '',
            website: lead.website || '',
            industry: lead.industry || '',
            jobTitle: lead.job_title || '',
            status: lead.status || 'New',
            createdAt: lead.created_at || new Date().toISOString(),
            updatedAt: lead.updated_at || new Date().toISOString(),
            assignedUserId: lead.owner_id || '',
            opportunityIds: [],
            updateIds: [],
            rejectionReasons: [],
          },
          company: companyData || {
            name: 'Unknown Company',
            website: '',
            industry: '',
            description: ''
          },
          user: adminUser || {
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin'
          }
        });

        // Save to aianalysis table
        const { error: saveError } = await supabase
          .from('aianalysis')
          .upsert({
            entity_type: 'Lead',
            entity_id: lead.id,
            analysis_type: 'enrichment',
            content: enrichmentResult.recommendations?.join('\n') || '',
            ai_output: enrichmentResult,
            match_score: enrichmentResult.leadScore,
            recommended_services: enrichmentResult.recommendedServices,
            use_case: enrichmentResult.useCase,
            pitch_notes: enrichmentResult.pitchNotes,
            email_template: enrichmentResult.emailTemplate,
            last_refreshed_at: new Date().toISOString(),
            next_refresh_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
            refresh_interval_minutes: 1440, // 24 hours
            status: 'success'
          });

        if (saveError) {
          console.error(`❌ Failed to save analysis for ${lead.company_name}:`, saveError);
          errorCount++;
        } else {
          console.log(`✅ Successfully processed ${lead.company_name}`);
          processedCount++;
        }

        // Wait between leads to avoid rate limits
        if (leads.indexOf(lead) < leads.length - 1) {
          const delay = getDelayBetweenLeads();
          console.log(`⏳ Waiting ${delay / 1000} seconds before next lead...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`❌ Error processing lead ${lead.company_name}:`, error);
        errorCount++;
        
        // Save error to aianalysis table
        await supabase
          .from('aianalysis')
          .upsert({
            entity_type: 'Lead',
            entity_id: lead.id,
            analysis_type: 'enrichment',
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            last_refreshed_at: new Date().toISOString()
          });
      }
    }

    // Update job status to completed
    await supabase
      .from('lead_analysis_job')
      .upsert({
        job_name: 'lead_enrichment_cron',
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_run: new Date().toISOString(),
        processed_count: processedCount,
        error_count: errorCount
      });

    console.log(`🎉 Cron job completed! Processed: ${processedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      message: 'Lead enrichment cron job completed successfully',
      processed: processedCount,
      errors: errorCount,
      total: leads.length
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    // Update job status to error
    await supabase
      .from('lead_analysis_job')
      .upsert({
        job_name: 'lead_enrichment_cron',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        last_run: new Date().toISOString()
      });

    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 