import { z } from 'zod';
import { getRetryConfig, CRON_CONFIG } from '@/lib/cron-config';

export const leadEnrichmentSchema = z.object({
  recommendations: z.array(z.string()),
  pitchNotes: z.string(),
  useCase: z.string(),
  leadScore: z.number().min(0).max(100),
  emailTemplate: z.string(),
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

// Gemini fallback function
async function callGeminiAPI(prompt: string) {
  // Respect Gemini's per-minute rate limit (max 60/minute)
  await sleep(1200); // 1.2s delay between requests
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
  }
  const data = await response.json();
  let generatedContent;
  try {
    // Gemini's response: candidates[0].content.parts[0].text (should be JSON string)
    generatedContent = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
  } catch (e) {
    throw new Error('Gemini response was not valid JSON.');
  }
  return generatedContent;
}

export async function leadEnrichmentFlow({ lead, user, company, tavilySummary, websiteSummary, companyScrapeData, opportunities, serperSummary, exaSummary }: { lead: any, user: any, company: any, tavilySummary?: string, websiteSummary?: string, companyScrapeData?: string, opportunities?: any[], serperSummary?: string, exaSummary?: string }) {
  const prompt = `
You are an expert B2B sales analyst with deep expertise in lead qualification and company-service alignment. Your user is ${user.name} from ${company?.name || 'N/A'}.

**COMMUNICATION & FORMATTING REQUIREMENTS:**
- Use the highest standards of formal written English in all responses.
- Do not use contractions. Always write out full forms. For example, write "do not" instead of "don't", "cannot" instead of "can't", "will not" instead of "won't", "I am" instead of "I'm", "you are" instead of "you're", "it is" instead of "it's", "they are" instead of "they're", and "we are" instead of "we're".
- Do not use em dashes anywhere in your response.
- Do not use en dashes unless they are part of a date range.
- Use only standard punctuation: periods, commas, colons, semicolons, and parentheses.
- When emphasis is needed, use bold formatting or restructure the sentence.
- For interruptions in thought, start a new sentence instead.

**DATA GATHERING INSTRUCTION:**
- Use the company name and website URL (if available) to gather and analyze information from the company website as part of your research and analysis. If a website URL is provided, prioritize using it for direct information. If only the company name is available, attempt to infer or locate the website for context.

## USER'S COMPANY ANALYSIS:
**Company Profile:**
- Name: ${company?.name || 'N/A'}
- Website: ${company?.website || 'N/A'}
- Industry: ${company?.industry || 'N/A'}
- Description: ${company?.description || 'N/A'}

**Services & Solutions:**
${(company?.services || []).map((s: any, i: number) => `${i+1}. ${s.name}: ${s.description || 'No description'} (Target: ${s.target_market || 'General'})`).join('\n') || 'N/A'}

**Company Website Analysis:**
${companyScrapeData ? `Website Content Summary: ${companyScrapeData}\n` : ''}

## LEAD COMPREHENSIVE PROFILE:
**Personal Information:**
- Name: ${lead.personName}
- Job Title: ${lead.jobTitle || 'N/A'}
- Email Domain: ${lead.email ? lead.email.split('@')[1] : 'N/A'}

**Company Information:**
- Company: ${lead.companyName}
- Industry: ${lead.industry || 'N/A'}
- Website: ${lead.website || 'N/A'}
- Country: ${lead.country || 'N/A'}

## ASSOCIATED OPPORTUNITIES:
${(opportunities && opportunities.length > 0)
  ? opportunities.map((opp, i) => `Opportunity ${i+1}:
  - Name: ${opp.name}
  - Status: ${opp.status}
  - Value: ${opp.value}
  - Start Date: ${opp.start_date}
  - End Date: ${opp.end_date}
  - Description: ${opp.description || 'N/A'}
`).join('\n')
  : 'No associated opportunities found.'}

## EXTERNAL INTELLIGENCE:
${tavilySummary ? `**Market Intelligence & News (Tavily):**\n${tavilySummary}\n` : ''}
${serperSummary ? `**Market Intelligence & News (Serper):**\n${serperSummary}\n` : ''}
${exaSummary ? `**Market Intelligence & News (Exa):**\n${exaSummary}\n` : ''}
${websiteSummary ? `**Lead's Company Website Analysis:**\n${websiteSummary}\n` : ''}



## SCORING METHODOLOGY:
Analyze the lead using a weighted 100-point scoring system. Use all available opportunity data to inform your score and recommendations:

**1. Company-Service Alignment (30 points)**
- Industry Match: How well does the lead's industry align with your services?
- Company Size Match: Is the lead's company size in your target range?
- Technology Needs: Do they likely need your specific solutions?
- Market Segment: Are they in your ideal customer segment?

**2. Authority & Decision-Making Power (25 points)**
- Job Title Analysis: Is this person likely a decision-maker or influencer?
- Department Relevance: Are they in a department that would use your services?
- Seniority Level: Do they have budget authority or significant influence?

**3. Company Quality & Fit (20 points)**
- Financial Stability: Revenue, funding, growth indicators
- Company Maturity: Age, market position, growth stage
- Geographic Alignment: Location advantages/challenges

**4. Engagement & Accessibility (15 points)**
- Email Domain Quality: Corporate email vs. generic
- Contact Information Quality: Professional contact details
- Digital Presence: Professional online presence

**5. Timing & Market Factors (10 points)**
- Industry Trends: Is their industry growing/investing in your solutions?
- Company News: Recent developments indicating need for your services
- Competitive Landscape: How saturated is their market with your competitors?

## DELIVERABLES:
Based on this comprehensive analysis, provide:

1. **Lead Score**: Single number (0-100) with a one-sentence rationale
2. **Recommended Services**: Suggest 3-4 specific services or products that would be a good fit for this lead.
3. **Pitch Notes**: Provide concise, actionable talking points for a sales pitch (no more than 2-3 sentences, max 60 words).
4. **Use Case**: Describe a compelling use case for this lead (no more than 2-3 sentences, max 60 words).
5. **Email Subject**: Provide a concise, relevant subject line for the email.
6. **Email Template**: Write a personalized, ready-to-send cold outreach email to the lead's main contact, referencing their company, your company, and the recommended services. Use a professional, friendly tone. Use all available data. Do not use placeholders like [Your Name] or [Company Name]; fill with real data or leave blank if not available. The email template must start with the subject line in the format: "Subject: <your subject here>" on the first line.

**Email Formatting Requirements:**
- The greeting must use only the first name of the contact (e.g., 'Dear Sam' instead of 'Dear Sam Holiday').
- The email body must include the following call scheduling link: https://meet.neuralarc.ai/
- The email template must start with the subject line in the format: "Subject: <your subject here>" on the first line.
- The signature must be exactly as follows:
Best regards,
Nyra
Neural Intelligence Officer,
NeuralArc Inc
https://neuralarc.ai

Return a valid JSON object with this exact schema:
{
  "leadScore": number,
  "recommendations": string[],
  "pitchNotes": string,
  "useCase": string,
  "emailSubject": string,
  "emailTemplate": string
}

IMPORTANT: Provide only valid JSON without markdown formatting. Base all analysis on actual data provided, not assumptions. The email template must always be filled with real data, not placeholders.
`;

  try {
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
  } catch (error: any) {
    // If OpenRouter fails with a 429, fallback to Gemini
    if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
      console.warn('OpenRouter rate limit hit, falling back to Gemini...');
      return await callGeminiAPI(prompt);
    }
    throw error;
  }
} 