'use server';

/**
 * @fileOverview AI-powered daily summary reports for each account.
 *
 * - generateDailyAccountSummary - A function that generates a daily summary report for a given account.
 * - GenerateDailyAccountSummaryInput - The input type for the generateDailyAccountSummary function.
 * - GenerateDailyAccountSummaryOutput - The return type for the generateDailyAccountSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyAccountSummaryInputSchema = z.object({
  accountId: z.string().describe('The ID of the account to generate a summary for.'),
  accountName: z.string().describe('The name of the account.'),
  recentUpdates: z.string().describe('A summary of recent updates for the account.'),
  keyMetrics: z.string().describe('Key metrics for the account.'),
});
export type GenerateDailyAccountSummaryInput = z.infer<
  typeof GenerateDailyAccountSummaryInputSchema
>;

const GenerateDailyAccountSummaryOutputSchema = z.object({
  summary: z.string().describe('A daily summary report for the account.'),
  relationshipHealth: z.string().describe('An indicator of the relationship health with the account.'),
});
export type GenerateDailyAccountSummaryOutput = z.infer<
  typeof GenerateDailyAccountSummaryOutputSchema
>;

export async function generateDailyAccountSummary(
  input: GenerateDailyAccountSummaryInput
): Promise<GenerateDailyAccountSummaryOutput> {
  return generateDailyAccountSummaryFlow(input);
}

const getRelationshipHealth = ai.defineTool({
  name: 'getRelationshipHealth',
  description: 'Determines the health of the relationship with the given account.',
  inputSchema: z.object({
    accountName: z.string().describe('The name of the account.'),
    recentUpdates: z.string().describe('A summary of recent updates for the account.'),
    keyMetrics: z.string().describe('Key metrics for the account.'),
  }),
  outputSchema: z.string().describe('A short description of the relationship health (e.g., healthy, at risk, needs attention).'),
},
async (input) => {
    // Placeholder implementation for relationship health assessment
    // In a real application, this would involve more sophisticated analysis
    return `The relationship with ${input.accountName} is currently healthy based on recent updates and key metrics.`
  }
);

const prompt = ai.definePrompt({
  name: 'generateDailyAccountSummaryPrompt',
  input: {schema: GenerateDailyAccountSummaryInputSchema},
  output: {schema: GenerateDailyAccountSummaryOutputSchema},
  tools: [getRelationshipHealth],
  prompt: `You are an AI assistant specializing in generating daily summary reports for key accounts.

  Generate a concise and informative daily summary report for the following account.
  The report should include key metrics, a summary of recent updates, and an overall assessment of the account's status.
  Also determine the relationship health with the account using the getRelationshipHealth tool.

  Account Name: {{{accountName}}}
  Recent Updates: {{{recentUpdates}}}
  Key Metrics: {{{keyMetrics}}}

  Here's an example of a good summary:
  "Today's summary for {{accountName}} shows positive trends in key metrics. Recent updates indicate successful project milestones.  The relationship health is strong."

  Return the summary in the 'summary' field.
  Return a brief assessment of the relationship health in the 'relationshipHealth' field, using the getRelationshipHealth tool to determine the relationship health.
  `,
});

const generateDailyAccountSummaryFlow = ai.defineFlow(
  {
    name: 'generateDailyAccountSummaryFlow',
    inputSchema: GenerateDailyAccountSummaryInputSchema,
    outputSchema: GenerateDailyAccountSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
