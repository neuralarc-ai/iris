import { z } from 'zod';
import { getRetryConfig, CRON_CONFIG } from '@/lib/cron-config';

export const leadEnrichmentSchema = z.object({
  recommendations: z.array(z.string()),
  pitchNotes: z.string(),
  useCase: z.string(),
  leadScore: z.number().min(0).max(100),
});

// Utility function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = getRetryConfig().maxRetries,
  baseDelay: number = getRetryConfig().baseDelay
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If it's a rate limit error and we haven't exceeded max retries
      if (error.message?.includes('Too Many Requests') && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff: 5s, 10s, 20s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await sleep(delay);
        continue;
      }
      
      // For other errors or max retries exceeded, throw immediately
      throw error;
    }
  }
  
  throw lastError!;
}

export async function leadEnrichmentFlow({ lead, user, company, tavilySummary, websiteSummary }: { lead: any, user: any, company: any, tavilySummary?: string, websiteSummary?: string }) {
  const prompt = `
You are an expert sales assistant. Your user is ${user.name}.

Your company information:
- Name: ${company?.name || 'N/A'}
- Website: ${company?.website || 'N/A'}
- Industry: ${company?.industry || 'N/A'}
- Description: ${company?.description || 'N/A'}
- Services: ${(company?.services || []).map((s: any) => s.name).join(', ') || 'N/A'}

${tavilySummary ? `Recent news and insights about ${lead.companyName} and ${lead.industry || 'their industry'}:\n${tavilySummary}\n` : ''}
${websiteSummary ? `Summary of ${lead.companyName}'s website (${lead.website}):\n${websiteSummary}\n` : ''}

Analyze the following lead and provide tailored sales assets.

Lead Information:
- Name: ${lead.personName}
- Company: ${lead.companyName}
- Country: ${lead.country || 'N/A'}
- Industry: ${lead.industry || 'N/A'}
- Job Title: ${lead.jobTitle || 'N/A'}
- Website: ${lead.website || 'N/A'}

Based on this, generate the following:
1.  **Recommendations**: Suggest 3-4 specific services or products that would be a good fit for this lead. Present them as a JSON array of strings.
2.  **Pitch Notes**: Provide concise, actionable talking points for a sales pitch (no more than 2-3 sentences, max 60 words).
3.  **Use Case**: Describe a compelling use case for this lead (no more than 2-3 sentences, max 60 words).
4.  **Lead Score**: Give a single number (0-100) for how strong a fit this lead is for our company, based on all the above.

Return a valid JSON object with keys: recommendations, pitchNotes, useCase, leadScore.
IMP: give the output in a valid JSON string (it should not be wrapped in markdown, just plain json object) and stick to the schema mentioned here: {"recommendations": string[], "pitchNotes": string, "useCase": string, "leadScore": number}.
`;

  return await retryWithBackoff(async () => {
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
        response_format: { type: 'json_object' },
        temperature: CRON_CONFIG.API.OPENROUTER_TEMPERATURE,
        max_tokens: CRON_CONFIG.API.OPENROUTER_MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    let generatedContent;
    try {
      generatedContent = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse AI response:', e, data);
      throw new Error('AI response was not valid JSON.');
    }
    return generatedContent;
  });
} 