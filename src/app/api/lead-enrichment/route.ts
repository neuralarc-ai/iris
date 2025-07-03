import { NextRequest, NextResponse } from 'next/server';
import { leadEnrichmentFlow } from '@/ai/flows/lead-enrichment';
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

// Add Serper API integration
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

// Add Exa API integration
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

// Helper to enqueue a job
async function enqueueLeadAnalysisJob(leadId: string) {
  await supabase.from('lead_analysis_job').insert([
    {
      id: uuidv4(),
      lead_id: leadId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const refresh = url.searchParams.get('refresh') === 'true';
    const body = await req.text();
    let lead, user, leadId, triggerEnrichment, forceRefresh;
    try {
      const parsed = JSON.parse(body);
      lead = parsed.lead;
      user = parsed.user;
      leadId = parsed.leadId;
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

    // If triggerEnrichment is requested, fetch lead data and process
    if (triggerEnrichment && leadId) {
      // Fetch lead data from database
      const { data: leadData, error: leadError } = await supabase
        .from('lead')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !leadData) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // Fetch user data
      const userId = leadData.owner_id;
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Transform lead data to match expected format
      lead = {
        id: leadData.id,
        companyName: leadData.company_name || '',
        personName: leadData.person_name || '',
        email: leadData.email || '',
        phone: leadData.phone || '',
        linkedinProfileUrl: leadData.linkedin_profile_url || '',
        country: leadData.country || '',
        website: leadData.website || '',
        industry: leadData.industry || '',
        jobTitle: leadData.job_title || '',
        status: leadData.status || 'New',
        createdAt: leadData.created_at || new Date().toISOString(),
        updatedAt: leadData.updated_at || new Date().toISOString(),
        assignedUserId: leadData.owner_id || '',
        opportunityIds: [],
        updateIds: [],
        rejectionReasons: [],
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

    // If refresh is requested, enqueue a job and return
    if (refresh) {
      await enqueueLeadAnalysisJob(lead.id);
      return NextResponse.json({ message: 'Refresh job enqueued.' });
    }

    // Check for existing analysis (within 24h)
    if (!forceRefresh) {
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

      if (existing && existing.last_refreshed_at && Date.now() - new Date(existing.last_refreshed_at).getTime() < 24 * 60 * 60 * 1000) {
        return NextResponse.json(existing.ai_output);
      }
    }

    // Fetch Tavily data
    const companyNews = await fetchTavilySummary(`${lead.companyName} ${lead.industry} news 2024`);
    const industryTrends = await fetchTavilySummary(`${lead.industry} technology trends 2024`);
    const painPoints = await fetchTavilySummary(`${lead.industry} challenges pain points 2024`);
    const tavilySummary = `Company News: ${companyNews}\nIndustry Trends: ${industryTrends}\nPain Points: ${painPoints}`;
    const websiteSummary = await fetchWebsiteSummary(lead.website || company?.website || '');

    // Fetch Serper data
    const serperNews = await fetchSerperSummary(`${lead.companyName} ${lead.industry} news 2024`);
    const serperTrends = await fetchSerperSummary(`${lead.industry} technology trends 2024`);
    const serperSummary = `Serper News: ${serperNews}\nSerper Trends: ${serperTrends}`;

    // Fetch Exa data
    const exaSummary = await fetchExaSummary(`${lead.companyName} ${lead.industry} company profile`);

    // Fetch opportunities associated with this lead
    const { data: opportunitiesRaw } = await supabase
      .from('opportunity')
      .select('*')
      .eq('account_id', lead.id); // If you link opportunities to lead via account_id or another field, adjust as needed
    const opportunities = opportunitiesRaw || [];

    // Generate AI analysis
    let aiResult;
    try {
      aiResult = await leadEnrichmentFlow({ lead, user, company, tavilySummary, websiteSummary, opportunities, serperSummary, exaSummary });
    } catch (error) {
      console.error('AI enrichment failed:', error);
      return NextResponse.json({ error: 'AI enrichment failed due to insufficient data or an AI error.' }, { status: 500 });
    }
    // Validate AI result
    if (!aiResult || !aiResult.recommendations || !aiResult.pitchNotes || !aiResult.useCase || !aiResult.emailTemplate) {
      return NextResponse.json({ error: 'AI enrichment returned incomplete data.' }, { status: 500 });
    }
    // Add a small random factor to the lead score for realism
    const randomDelta = Math.floor(Math.random() * 7) - 3; // -3 to +3
    aiResult.leadScore = Math.max(0, Math.min(100, aiResult.leadScore + randomDelta));

    // Store in aianalysis
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