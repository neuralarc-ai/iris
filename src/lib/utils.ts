import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from '@supabase/supabase-js';
import { CRON_CONFIG } from './cron-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchAndCacheCompanyWebsiteSummary(company: any, forceRefresh = false): Promise<string> {
  if (!company || !company.website) {
    console.log('No company or website provided for summary.');
    return '';
  }
  const refreshHours = CRON_CONFIG.API.COMPANY_WEBSITE_SUMMARY_REFRESH_HOURS;
  const now = new Date();
  const lastRefreshed = company.last_website_summary_refreshed ? new Date(company.last_website_summary_refreshed) : null;
  if (!forceRefresh && company.website_summary && company.website_summary.trim() && lastRefreshed && ((now.getTime() - lastRefreshed.getTime()) < refreshHours * 60 * 60 * 1000)) {
    console.log('Using cached company website summary.');
    return company.website_summary;
  }
  let summary = '';
  try {
    // Use Exa's /contents endpoint for live, deep crawl
    console.log('Fetching company summary from Exa /contents for:', company.website);
    const exaRes = await fetch('https://api.exa.ai/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY || '',
      },
      body: JSON.stringify({
        urls: [company.website],
        livecrawl: 'always',
        subpages: 5,
        subpage_target: ['about', 'products', 'company', 'services', 'team'],
        summary: { query: "Summarize this company's offerings, mission, and unique value in 4-7 sentences." },
        text: true
      }),
    });
    const exaData = await exaRes.json();
    console.log('Exa contents API response:', exaData);
    if (exaData.results && exaData.results.length > 0) {
      // 1. Main page summary (highest priority)
      summary = exaData.results[0].summary?.text || '';
      // 2. Append subpage summaries (if any)
      if (exaData.results[0].subpages && Array.isArray(exaData.results[0].subpages)) {
        for (const sub of exaData.results[0].subpages) {
          if (sub.summary?.text) summary += '\n' + sub.summary.text;
        }
      }
      // 3. Fallback: use the first 1000 chars of the main text if no summary
      if (!summary && exaData.results[0].text) {
        summary = exaData.results[0].text.slice(0, 1000);
      }
    }
    summary = summary.trim();
    console.log('Final summary to save:', summary);
    // Save to Supabase
    const { error } = await supabase
      .from('company')
      .update({
        website_summary: summary,
        last_website_summary_refreshed: now.toISOString(),
      })
      .eq('id', company.id);
    if (error) {
      console.error('Error updating company website summary in Supabase:', error);
      throw error;
    }
    return summary;
  } catch (err) {
    console.error('Error fetching or saving company website summary:', err);
    return '';
  }
}
