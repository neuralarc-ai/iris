
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
  healthScore: z.number().describe('A numerical score representing the relationship health (0.0 to 1.0).'),
  summary: z.string().describe('A concise summary explaining the relationship health score.'),
});
export type RelationshipHealthOutput = z.infer<typeof RelationshipHealthOutputSchema>;


const relationshipHealthTool = ai.defineTool({
  name: 'getRelationshipHealth',
  description: 'Returns the current relationship health score and summary based on communication history.',
  inputSchema: RelationshipHealthInputSchema,
  outputSchema: RelationshipHealthOutputSchema,
},
async (input) => {
  // Placeholder implementation for relationship health assessment
  const historyLength = input.communicationHistory.length;
  let score = 0.5;
  let summary = "The relationship health is moderate.";

  if (historyLength > 500) {
    score = 0.8;
    summary = "The relationship appears strong due to frequent communication.";
  } else if (historyLength < 100 && historyLength > 0) {
    score = 0.3;
    summary = "The relationship might need more engagement due to limited communication.";
  } else if (historyLength === 0) {
    score = 0.1;
    summary = "No communication history provided to assess relationship health.";
  }

  // Simulate some keywords for sentiment
  if (input.communicationHistory.toLowerCase().includes("great") || input.communicationHistory.toLowerCase().includes("excellent")) {
    score = Math.min(1.0, score + 0.15);
  }
  if (input.communicationHistory.toLowerCase().includes("problem") || input.communicationHistory.toLowerCase().includes("issue")) {
    score = Math.max(0.0, score - 0.15);
  }

  return {
    healthScore: parseFloat(score.toFixed(2)),
    summary: summary,
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
  output: {schema: RelationshipHealthOutputSchema}, 
  prompt: `Based on the following communication history, use the getRelationshipHealth tool to get the relationship health score and summary.
  Then, provide the health score and summary as a JSON object matching the defined output schema.

  Communication History: {{{communicationHistory}}}`,
});

export type IntelligentInsightsInput = {
  communicationHistory: string;
};

export type IntelligentInsightsOutput = {
  communicationAnalysis: CommunicationAnalysisOutput | null;
  updateSummary: UpdateSummaryOutput | null;
  relationshipHealth: RelationshipHealthOutput | null;
};


const intelligentInsightsFlow = ai.defineFlow(
  {
    name: 'intelligentInsightsFlow',
    inputSchema: z.object({ communicationHistory: z.string() }),
    outputSchema: z.object({
      communicationAnalysis: CommunicationAnalysisOutputSchema.nullable(),
      updateSummary: UpdateSummaryOutputSchema.nullable(),
      relationshipHealth: RelationshipHealthOutputSchema.nullable(),
    }),
  },
  async (input: IntelligentInsightsInput): Promise<IntelligentInsightsOutput> => {
    let communicationAnalysisResult: CommunicationAnalysisOutput | null = null;
    let updateSummaryResult: UpdateSummaryOutput | null = null;
    let relationshipHealthResult: RelationshipHealthOutput | null = null;

    try {
      communicationAnalysisResult = await analyzeCommunicationFlow({
        communicationHistory: input.communicationHistory,
      });
    } catch (error) {
      console.error("Error in analyzeCommunicationFlow:", error);
      // communicationAnalysisResult remains null
    }

    try {
      updateSummaryResult = await summarizeUpdateFlow({
        updateContent: input.communicationHistory, 
      });
    } catch (error) {
      console.error("Error in summarizeUpdateFlow:", error);
      // updateSummaryResult remains null
    }

    try {
      const { output } = await relationshipHealthPrompt({
        communicationHistory: input.communicationHistory,
      });
      relationshipHealthResult = output;
    } catch (error) {
      console.error("Error in relationshipHealthPrompt:", error);
      // relationshipHealthResult remains null
    }

    return {
      communicationAnalysis: communicationAnalysisResult,
      updateSummary: updateSummaryResult,
      relationshipHealth: relationshipHealthResult,
    };
  }
);

export async function generateInsights(input: IntelligentInsightsInput): Promise<IntelligentInsightsOutput> {
  return intelligentInsightsFlow(input);
}
