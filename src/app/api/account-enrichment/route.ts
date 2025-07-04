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

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    let account, user, accountId, triggerEnrichment, forceRefresh;
    try {
      const parsed = JSON.parse(body);
      account = parsed.account;
      user = parsed.user;
      accountId = parsed.accountId;
      triggerEnrichment = parsed.triggerEnrichment;
      forceRefresh = parsed.forceRefresh;
    } catch (parseError) {
      console.error('Failed to parse JSON body:', parseError, 'Body:', body);
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables!');
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not set.' }, { status: 500 });
    }

    // Fetch company data
    const { data: company } = await supabase.from('company').select('*, services:company_service(*)').single();

    // If triggerEnrichment is requested, fetch account data and process
    if (triggerEnrichment && accountId) {
      // Fetch account data from database
      const { data: accountData, error: accountError } = await supabase
        .from('account')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accountError || !accountData) {
        return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      }

      // Fetch user data
      const userId = accountData.owner_id;
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Transform account data to match expected format
      account = {
        id: accountData.id,
        name: accountData.name || '',
        type: accountData.type || '',
        status: accountData.status || '',
        description: accountData.description || '',
        contact_email: accountData.contact_email || '',
        industry: accountData.industry || '',
        contact_person_name: accountData.contact_person_name || '',
        contact_phone: accountData.contact_phone || '',
        website: accountData.website || '',
        country: accountData.country || '',
      };

      // If no user data found, try to get an admin user as fallback
      if (!userData) {
        const { data: adminUser } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'admin')
          .single();
        user = adminUser || { name: 'Admin User', email: 'admin@example.com', role: 'admin' };
      } else {
        user = userData;
      }
    }

    // Check for existing analysis (within 24h)
    if (!forceRefresh) {
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
        return NextResponse.json(existing.ai_output);
      }
    }

    // Fetch Tavily data
    const companyNews = await fetchTavilySummary(`${account.name} ${account.industry} news 2024`);
    const industryTrends = await fetchTavilySummary(`${account.industry} technology trends 2024`);
    const painPoints = await fetchTavilySummary(`${account.industry} challenges pain points 2024`);
    const tavilySummary = `Company News: ${companyNews}\nIndustry Trends: ${industryTrends}\nPain Points: ${painPoints}`;
    const websiteSummary = await fetchWebsiteSummary(account.website || company?.website || '');

    // Generate AI analysis
    let aiResult;
    try {
      aiResult = await accountEnrichmentFlow({ account, user, company, tavilySummary, websiteSummary });
    } catch (error) {
      console.error('AI enrichment failed:', error);
      return NextResponse.json({ error: 'AI enrichment failed due to insufficient data or an AI error.' }, { status: 500 });
    }
    // Validate AI result
    if (!aiResult || !aiResult.recommendations || !aiResult.pitchNotes || !aiResult.useCase || !aiResult.emailTemplate) {
      return NextResponse.json({ error: 'AI enrichment returned incomplete data.' }, { status: 500 });
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

    return NextResponse.json(aiResult);
  } catch (e: any) {
    console.error('AI enrichment error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 