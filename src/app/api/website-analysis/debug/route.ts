import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const testUrl = url.searchParams.get('url') || 'https://openai.com';
    
    console.log('Testing with URL:', testUrl);
    
    if (!process.env.EXA_API_KEY) {
      return NextResponse.json({ error: 'EXA_API_KEY is not configured' }, { status: 500 });
    }

    // Test basic search
    const searchResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query: `site:${new URL(testUrl).hostname} about us`,
        num_results: 2,
        highlights: { num_sentences: 2 },
        use_autoprompt: true,
        type: 'keyword'
      }),
    });

    console.log('Search response status:', searchResponse.status);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.log('Search error:', errorText);
      return NextResponse.json({ 
        error: 'Search failed', 
        status: searchResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', searchData);

    // Test fallback search
    const fallbackResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query: `${new URL(testUrl).hostname} company about us description`,
        num_results: 2,
        highlights: { num_sentences: 3 },
        use_autoprompt: true,
        type: 'keyword'
      }),
    });

    console.log('Fallback response status:', fallbackResponse.status);
    
    if (!fallbackResponse.ok) {
      const errorText = await fallbackResponse.text();
      console.log('Fallback error:', errorText);
      return NextResponse.json({ 
        error: 'Fallback failed', 
        status: fallbackResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const fallbackData = await fallbackResponse.json();
    console.log('Fallback results:', fallbackData);

    return NextResponse.json({
      success: true,
      searchResults: searchData,
      fallbackResults: fallbackData
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 });
  }
} 