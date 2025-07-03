import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { website } = await req.json();

    if (!website) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    if (!process.env.EXA_API_KEY) {
      return NextResponse.json({ error: 'EXA_API_KEY is not configured' }, { status: 500 });
    }

    // Clean and validate the website URL
    let cleanUrl = website.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    let hostname: string;
    try {
      hostname = new URL(cleanUrl).hostname;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid website URL format',
        description: 'Please enter a valid website URL (e.g., example.com or https://example.com)',
        success: false 
      }, { status: 400 });
    }

    // 1. Search for relevant company/about pages
    const searchRes = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query: `site:${hostname} about company`,
        numResults: 4,
        type: 'keyword',
        includeDomains: [hostname],
      }),
    });
    if (!searchRes.ok) {
      return NextResponse.json({ error: 'Exa search failed', status: searchRes.status }, { status: 500 });
    }
    const searchData = await searchRes.json();
    const urls = (searchData.results || [])
      .map((r: any) => r.url)
      .filter((u: string) => typeof u === 'string' && u.startsWith('http'))
      .slice(0, 2);

    if (!urls.length) {
      return NextResponse.json({ 
        description: 'Unable to find relevant company/about pages on the provided website.',
        success: false 
      });
    }

    // 2. Get full contents of those URLs
    const contentsRes = await fetch('https://api.exa.ai/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        urls,
        text: true,
        livecrawl: 'always',
        subpages: 2,
        subpageTarget: ['about', 'company'],
      }),
    });
    if (!contentsRes.ok) {
      return NextResponse.json({ error: 'Exa contents failed', status: contentsRes.status }, { status: 500 });
    }
    const contentsData = await contentsRes.json();
    const firstResult = contentsData.results?.[0];

    // 3. Use summary, highlights, or first paragraph of text
    let description = '';
    if (firstResult?.summary?.text) {
      description = firstResult.summary.text;
    } else if (firstResult?.highlights?.length) {
      description = firstResult.highlights.join(' ');
    } else if (firstResult?.text) {
      // Use the first paragraph with >50 chars, or first 300 chars
      const para = firstResult.text.split('\n').find((p: string) => p.length > 50);
      description = para || firstResult.text.slice(0, 300);
    }

    if (!description) {
      return NextResponse.json({ 
        description: 'Unable to extract company description from the provided website. Please enter it manually.',
        success: false 
      });
    }

    // Clean up the description
    description = description.replace(/\s+/g, ' ').trim();

    return NextResponse.json({ 
      description,
      success: true,
      source: firstResult?.url || urls[0] || cleanUrl
    });

  } catch (error) {
    console.error('Website analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze website',
      description: 'Unable to extract company description. Please enter it manually.',
      success: false 
    }, { status: 500 });
  }
} 