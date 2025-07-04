import { NextRequest, NextResponse } from 'next/server';
import { accountEnrichmentFlow } from '@/ai/flows/account-enrichment';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_KEY!
);

async function fetchTavilySummary(query: string) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({ query, max_results: 3 }),
  });
  const data = await response.json();
  return data.results?.map((r: any) => r.snippet).join(' ') || '';
}

async function fetchWebsiteSummary(url: string) {
  if (!url) return '';
  const response = await fetch('https://api.tavily.com/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({ url }),
  });
  const data = await response.json();
  return data.summary || '';
}

async function fetchSerperSummary(query: string) {
  const response = await fetch('https://google.serper.dev/news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.SERPER_API_KEY || '',
    },
    body: JSON.stringify({ q: query }),
  });
  const data = await response.json();
  // Combine top 3 news snippets
  return data.news?.slice(0, 3).map((n: any) => n.snippet).join(' ') || '';
}

async function fetchExaSummary(query: string) {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXA_API_KEY || '',
    },
    body: JSON.stringify({
      query,
      num_results: 3,
      highlights: { num_sentences: 2 }
    }),
  });
  const data = await response.json();
  // Combine top 3 highlights/snippets
  return data.results?.map((r: any) => r.highlights?.join(' ') || r.text || '').join(' ') || '';
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables!');
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not set.' }, { status: 500 });
    }

    // Fetch all accounts
    const { data: accounts, error: accountError } = await supabase.from('account').select('*');
    if (accountError) {
      return NextResponse.json({ error: 'Failed to fetch accounts.' }, { status: 500 });
    }
    // Filter out inactive accounts
    const accountsToProcess = accounts.filter((account: any) => account.status !== 'Inactive');

    // Fetch company data
    const { data: company } = await supabase.from('company').select('*, services:company_service(*)').single();
    const companyScrapeData = company?.website_summary || '';

    // Fetch a default admin user (for context)
    const { data: adminUser } = await supabase.from('users').select('*').eq('role', 'admin').single();
    const user = adminUser || { name: 'Admin User', email: 'admin@example.com', role: 'admin' };

    let processedCount = 0;
    let errorCount = 0;

    for (const account of accountsToProcess) {
      try {
        // Check for existing analysis (within 24h)
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
        if (existing && existing.last_refreshed_at && Date.now() - new Date(existing.last_refreshed_at).getTime() < 24 * 60 * 60 * 1000) {
          continue;
        }

        // Fetch Tavily data
        const companyNews = await fetchTavilySummary(`${account.name} ${account.industry} news 2024`);
        const industryTrends = await fetchTavilySummary(`${account.industry} technology trends 2024`);
        const painPoints = await fetchTavilySummary(`${account.industry} challenges pain points 2024`);
        const tavilySummary = `Company News: ${companyNews}\nIndustry Trends: ${industryTrends}\nPain Points: ${painPoints}`;
        const websiteSummary = await fetchWebsiteSummary(account.website || company?.website || '');

        // Fetch Serper data
        const serperNews = await fetchSerperSummary(`${account.name} ${account.industry} news 2024`);
        const serperTrends = await fetchSerperSummary(`${account.industry} technology trends 2024`);
        const serperSummary = `Serper News: ${serperNews}\nSerper Trends: ${serperTrends}`;

        // Fetch Exa data
        const exaSummary = await fetchExaSummary(`${account.name} ${account.industry} company profile`);

        // Fetch opportunities associated with this account
        const { data: opportunitiesRaw } = await supabase
          .from('opportunity')
          .select('*')
          .eq('account_id', account.id);
        const opportunities = opportunitiesRaw || [];

        // Generate AI analysis
        let aiResult;
        try {
          aiResult = await accountEnrichmentFlow({ account, user, company, companyScrapeData, tavilySummary, websiteSummary, opportunities, serperSummary, exaSummary });
        } catch (error) {
          console.error('AI enrichment failed:', error);
          errorCount++;
          continue;
        }
        // Validate AI result
        if (!aiResult || !aiResult.recommendations || !aiResult.pitchNotes || !aiResult.useCase || !aiResult.emailTemplate) {
          errorCount++;
          continue;
        }
        // Add a small random factor to the account score for realism
        const randomDelta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        aiResult.accountScore = Math.max(0, Math.min(100, aiResult.accountScore + randomDelta));

        // Store in aianalysis
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
            email_template: aiResult.emailTemplate,
            ai_output: aiResult,
            status: 'success',
            last_refreshed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        processedCount++;
      } catch (e: any) {
        console.error('AI enrichment error:', e);
        errorCount++;
      }
    }
    return NextResponse.json({ processed: processedCount, errors: errorCount });
  } catch (e: any) {
    console.error('Account enrichment cron error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 