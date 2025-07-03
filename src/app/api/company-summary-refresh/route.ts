import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAndCacheCompanyWebsiteSummary } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SUPABASE_SERVICE_KEY!
  );
  const { data: company, error } = await supabase.from('company').select('*').single();
  if (error || !company) {
    return NextResponse.json({ error: error?.message || 'No company found' }, { status: 404 });
  }
  let forceRefresh = false;
  try {
    // Accept forceRefresh from JSON body or query param
    const body = req.headers.get('content-type')?.includes('application/json') ? await req.json() : {};
    if (body.forceRefresh === true) forceRefresh = true;
    const url = new URL(req.url);
    if (url.searchParams.get('forceRefresh') === 'true') forceRefresh = true;
    const summary = await fetchAndCacheCompanyWebsiteSummary(company, forceRefresh);
    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to refresh summary' }, { status: 500 });
  }
} 