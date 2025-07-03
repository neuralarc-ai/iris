import { NextRequest, NextResponse } from 'next/server';
import { CRON_CONFIG } from '@/lib/cron-config';

function extractAboutSection(text: string): string {
  // Try to extract the 'About us' section or similar
  const aboutMatch = text.match(/About us\n([\s\S]+?)(\n##|$)/i);
  if (aboutMatch) return aboutMatch[1].trim();
  // Remove markdown headers and job postings
  let cleaned = text.replace(/#+\s.*\n/g, '');
  cleaned = cleaned.replace(/We are Hiring[\s\S]+?(?=\n##|$)/gi, '');
  cleaned = cleaned.replace(/Updates[\s\S]+?(?=\n##|$)/gi, '');
  // Remove Employees section
  cleaned = cleaned.replace(/Employees at [^\n]+\n[\s\S]+?(?=\n##|$)/gi, '');
  // Truncate to 800 chars
  return cleaned.slice(0, 800);
}

async function fetchExaUrls(query: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY || '',
      },
      body: JSON.stringify({
        query,
        numResults: 3,
        category: 'company',
        type: 'auto',
      }),
    });
    const data = await response.json();
    return data.results?.map((r: any) => r.url).filter(Boolean) || [];
  } catch (e) {
    console.error('Exa search error:', e);
    return [];
  }
}

async function fetchExaContents(urls: string[]): Promise<string[]> {
  if (!urls.length) return [];
  try {
    const response = await fetch('https://api.exa.ai/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY || '',
      },
      body: JSON.stringify({
        urls,
        text: true,
        summary: { max_length: 1024 },
        livecrawl: 'preferred',
        context: true,
      }),
    });
    const data = await response.json();
    return data.results?.map((r: any) => r.text || r.summary?.text || '').filter(Boolean) || [];
  } catch (e) {
    console.error('Exa contents error:', e);
    return [];
  }
}

async function callOpenRouter(prompt: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: CRON_CONFIG.API.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'text' },
      temperature: CRON_CONFIG.API.OPENROUTER_TEMPERATURE,
      max_tokens: 256,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', response.status, errorText);
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
  }
  const data = await response.json();
  let description = data.choices?.[0]?.message?.content?.trim() || '';
  description = description.replace(/^"|"$/g, '').replace(/^`+|`+$/g, '').trim();
  return description;
}

export async function POST(req: NextRequest) {
  try {
    const { name, website, industry } = await req.json();
    if (!name && !website) {
      return NextResponse.json({ error: 'Missing company name or website.' }, { status: 400 });
    }

    // 1. Search for company URLs
    const exaQuery = `${name}${website ? ' ' + website : ''}${industry ? ' ' + industry : ''} company profile`;
    const urls = await fetchExaUrls(exaQuery);

    // 2. Fetch contents from URLs
    let exaTexts: string[] = [];
    if (urls.length) {
      exaTexts = await fetchExaContents(urls);
    }
    // Preprocess and extract the most relevant section
    const contextText = extractAboutSection(exaTexts.join('\n\n'));

    // 3. Prepare prompt
    let prompt = `You are an expert B2B business analyst. Write a concise, professional company description (max 80 words) for the following company, suitable for use in a CRM or sales platform. Use only real data from the provided company information. Do not use placeholders or make up facts. Use strict formal business English.\n\nCompany Name: ${name || 'N/A'}\nWebsite: ${website || 'N/A'}\nIndustry: ${industry || 'N/A'}\n\nCompany Information (from web, ignore job postings and unrelated sections):\n${contextText}\n\nReturn only the description text, no extra commentary.`;

    console.log('Company Description Prompt:', prompt);

    let description = '';
    try {
      description = await callOpenRouter(prompt);
    } catch (e: any) {
      console.error('AI Description Error:', e);
      // Retry with fallback generic prompt
      try {
        prompt = `You are an expert B2B business analyst. Write a generic, professional company description (max 80 words) for a company named ${name} in the ${industry || 'technology'} industry. If you do not have real data, use your best judgment based on the name and industry. Use strict formal business English.`;
        description = await callOpenRouter(prompt);
      } catch (fallbackError: any) {
        console.error('OpenRouter fallback minimal prompt error:', fallbackError);
        // Try a minimal prompt to test API key/quota
        try {
          const minimalPrompt = 'Say hello.';
          const minimalResult = await callOpenRouter(minimalPrompt);
          return NextResponse.json({ error: `AI failed for company description, but minimal prompt succeeded: ${minimalResult}` }, { status: 500 });
        } catch (minimalError: any) {
          console.error('OpenRouter minimal prompt error:', minimalError);
          return NextResponse.json({ error: `AI failed for all prompts. Minimal prompt error: ${minimalError.message}` }, { status: 500 });
        }
      }
    }

    console.log('AI Description Response:', description);

    if (!description) {
      return NextResponse.json({ error: 'AI did not return a description. Please try again or check your API keys.' }, { status: 500 });
    }

    return NextResponse.json({ description });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate description.' }, { status: 500 });
  }
} 