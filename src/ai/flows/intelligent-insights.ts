'use server';

/**
 * @fileOverview AI-powered intelligent insights flow for analyzing communication patterns, sentiment,
 * and summarizing updates to enhance decision-making.
 *
 * - analyzeCommunication - Analyzes communication patterns to identify key insights.
 * - summarizeUpdate - Summarizes lengthy updates, extracts action items, and suggests follow-ups.
 * - IntelligentInsightsInput - The input type for the intelligent insights flow.
 * - IntelligentInsightsOutput - The output type for the intelligent insights flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CommunicationAnalysisInputSchema = z.object({
  communicationHistory: z
    .string()
    .describe('The history of communication with a client or account.'),
});

export type CommunicationAnalysisInput = z.infer<typeof CommunicationAnalysisInputSchema>;

const CommunicationAnalysisOutputSchema = z.object({
  keyInsights: z.string().describe('Key insights derived from the communication history.'),
  sentimentAnalysis: z.string().describe('Sentiment analysis of the communication.'),
});

export type CommunicationAnalysisOutput = z.infer<typeof CommunicationAnalysisOutputSchema>;

const UpdateSummaryInputSchema = z.object({
  updateContent: z.string().describe('The content of the update to be summarized.'),
});

export type UpdateSummaryInput = z.infer<typeof UpdateSummaryInputSchema>;

const UpdateSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the update content.'),
  actionItems: z.string().describe('Action items extracted from the update content.'),
  followUpSuggestions: z
    .string()
    .describe('Suggestions for follow-up actions based on the update.'),
});

export type UpdateSummaryOutput = z.infer<typeof UpdateSummaryOutputSchema>;

const RelationshipHealthInputSchema = z.object({
  communicationHistory: z
    .string()
    .describe('The history of communication with a client or account.'),
});

const RelationshipHealthOutputSchema = z.object({
  healthScore: z.number().describe('A numerical score representing the relationship health.'),
  summary: z.string().describe('A summary of the relationship health.'),
});

const relationshipHealthTool = ai.defineTool({
  name: 'getRelationshipHealth',
  description: 'Returns the current relationship health score and summary.',
  inputSchema: RelationshipHealthInputSchema,
  outputSchema: RelationshipHealthOutputSchema,
},
async (input) => {
  // TODO: Implement the relationship health logic
  return {
    healthScore: 0.75,
    summary: 'The relationship is generally healthy, but there are some areas for improvement.',
  };
});

export async function analyzeCommunication(input: CommunicationAnalysisInput): Promise<CommunicationAnalysisOutput> {
  return analyzeCommunicationFlow(input);
}

export async function summarizeUpdate(input: UpdateSummaryInput): Promise<UpdateSummaryOutput> {
  return summarizeUpdateFlow(input);
}

const analyzeCommunicationPrompt = ai.definePrompt({
  name: 'analyzeCommunicationPrompt',
  input: {schema: CommunicationAnalysisInputSchema},
  output: {schema: CommunicationAnalysisOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing communication patterns and sentiment.

  Analyze the following communication history and provide key insights and a sentiment analysis.

  Communication History: {{{communicationHistory}}}`,
});

const summarizeUpdatePrompt = ai.definePrompt({
  name: 'summarizeUpdatePrompt',
  input: {schema: UpdateSummaryInputSchema},
  output: {schema: UpdateSummaryOutputSchema},
  prompt: `You are an AI assistant specializing in summarizing updates, extracting action items, and suggesting follow-up actions.

  Summarize the following update content, extract action items, and suggest follow-up actions.

  Update Content: {{{updateContent}}}`,
});

const analyzeCommunicationFlow = ai.defineFlow(
  {
    name: 'analyzeCommunicationFlow',
    inputSchema: CommunicationAnalysisInputSchema,
    outputSchema: CommunicationAnalysisOutputSchema,
  },
  async input => {
    const {output} = await analyzeCommunicationPrompt(input);
    return output!;
  }
);

const summarizeUpdateFlow = ai.defineFlow(
  {
    name: 'summarizeUpdateFlow',
    inputSchema: UpdateSummaryInputSchema,
    outputSchema: UpdateSummaryOutputSchema,
  },
  async input => {
    const {output} = await summarizeUpdatePrompt(input);
    return output!;
  }
);

const relationshipHealthPrompt = ai.definePrompt({
  name: 'relationshipHealthPrompt',
  tools: [relationshipHealthTool],
  input: {schema: CommunicationAnalysisInputSchema},
  prompt: `Based on the following communication history, use the getRelationshipHealth tool to get the relationship health score and summary.

  Communication History: {{{communicationHistory}}}`,
});

export type IntelligentInsightsInput = {
  communicationHistory: string;
};

const intelligentInsightsFlow = ai.defineFlow(
  {
    name: 'intelligentInsightsFlow',
  },
  async (input: IntelligentInsightsInput) => {
    // Example usage of analyzeCommunicationFlow and summarizeUpdateFlow
    const communicationAnalysis = await analyzeCommunicationFlow({
      communicationHistory: input.communicationHistory,
    });

    const updateSummary = await summarizeUpdateFlow({
      updateContent: input.communicationHistory, // Using the communication history as a stand-in for update content
    });

    const relationshipHealth = await relationshipHealthPrompt({
      communicationHistory: input.communicationHistory,
    });

    return {
      communicationAnalysis,
      updateSummary,
      relationshipHealth,
    };
  }
);

export async function generateInsights(input: IntelligentInsightsInput) {
  return intelligentInsightsFlow(input);
}

export type IntelligentInsightsOutput = Awaited<ReturnType<typeof intelligentInsightsFlow>>;
