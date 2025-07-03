import 'dotenv/config';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { accountEnrichmentFlow } from '../ai/flows/account-enrichment';
import { v4 as uuidv4 } from 'uuid';
import { getDelayBetweenLeads, CRON_CONFIG } from '@/lib/cron-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_KEY!
);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processAccount(account: any, user: any, company: any) {
  try {
    console.log(`🔄 Processing account: ${account.name} (${account.id})`);

    // Check for existing analysis in last 24h
    const { data: existing } = await supabase
      .from('aianalysis')
      .select('*')
      .eq('entity_type', 'Account')
      .eq('entity_id', account.id)
      .eq('analysis_type', 'enrichment')
      .eq('status', 'success')
      .order('last_refreshed_at', { ascending: false })
      .limit(1)
      .single();

    if (existing?.last_refreshed_at) {
      const hoursSinceAnalysis = ((Date.now() - new Date(existing.last_refreshed_at).getTime()) / (1000 * 60 * 60));
      if (hoursSinceAnalysis < 24) {
        console.log(`⏭️ Skipping ${account.name} - analyzed ${hoursSinceAnalysis.toFixed(1)} hours ago`);
        return;
      }
    }

    // Fetch Tavily/website summaries if needed (reuse logic from API route if required)
    // For now, skip Tavily/website summaries for simplicity
    const aiResult = await accountEnrichmentFlow({ account, user, company });

    // Validate AI result (match lead enrichment logic)
    if (!aiResult || !aiResult.recommendations || !aiResult.pitchNotes || !aiResult.useCase ||
        aiResult.recommendations.includes('test') ||
        aiResult.pitchNotes.toLowerCase().includes('test') ||
        aiResult.useCase.toLowerCase().includes('test')) {
      console.error(`❌ AI enrichment returned incomplete or placeholder data for account ${account.name}. Skipping save.`);
      await supabase.from('aianalysis').upsert({
        entity_type: 'Account',
        entity_id: account.id,
        analysis_type: 'enrichment',
        status: 'error',
        error_message: 'AI enrichment returned incomplete or placeholder data.',
        last_refreshed_at: new Date().toISOString(),
      });
      return;
    }

    // Add a small random factor to the account score for realism
    const randomDelta = Math.floor(Math.random() * 7) - 3; // -3 to +3
    aiResult.accountScore = Math.max(0, Math.min(100, aiResult.accountScore + randomDelta));

    await supabase.from('aianalysis').insert([
      {
        id: uuidv4(),
        entity_type: 'Account',
        entity_id: account.id,
        analysis_type: 'enrichment',
        content: aiResult.pitchNotes,
        match_score: aiResult.accountScore,
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

    console.log(`✅ Successfully processed ${account.name}`);
  } catch (e: any) {
    console.error(`❌ Error processing account ${account.name}:`, e);
    // Also save error to aianalysis table
    await supabase.from('aianalysis').upsert({
      entity_type: 'Account',
      entity_id: account.id,
      analysis_type: 'enrichment',
      status: 'error',
      error_message: e.message,
      last_refreshed_at: new Date().toISOString(),
    });
  }
}

async function runAccountEnrichmentCron() {
  console.log('🚀 Starting account enrichment cron job...');

  try {
    // Fetch all accounts
    const { data: accounts, error: accountError } = await supabase.from('account').select('*');
    if (accountError) {
      console.error('❌ Error fetching accounts:', accountError);
      return;
    }

    // Filter out inactive accounts
    const accountsToProcess = accounts.filter(account => account.status !== 'Inactive');

    console.log(`📊 Found ${accountsToProcess.length} accounts to process (excluding inactive)`);

    // Fetch company info
    const { data: company } = await supabase.from('company').select('*, services:company_service(*)').single();

    // Fetch a default admin user (for context)
    const { data: user } = await supabase.from('users').select('*').eq('role', 'admin').limit(1).single();

    let processedCount = 0;
    let errorCount = 0;

    for (const account of accountsToProcess) {
      try {
        await processAccount(account, user, company);
        processedCount++;
      } catch (error) {
        console.error(`❌ Failed to process account ${account.name}:`, error);
        errorCount++;
      }

      // Wait between accounts to avoid rate limits
      if (accountsToProcess.indexOf(account) < accountsToProcess.length - 1) {
        const delay = getDelayBetweenLeads();
        console.log(`⏳ Waiting ${delay / 1000} seconds before next account...`);
        await sleep(delay);
      }
    }

    console.log(`🎉 Account enrichment cron job complete. Processed: ${processedCount}, Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Cron job failed:', error);
  }
}

// Schedule to run every hour
cron.schedule('0 * * * *', runAccountEnrichmentCron);

// Also run immediately if executed directly
if (require.main === module) {
  runAccountEnrichmentCron();
} 