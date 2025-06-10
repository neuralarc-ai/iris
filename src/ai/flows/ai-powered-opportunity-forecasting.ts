
// Implemented AI-powered opportunity forecasting flow to provide timeline predictions, completion date estimates, and bottleneck identification.

'use server';

/**
 * @fileOverview Implements AI-powered forecasting features for opportunity management.
 *
 * - aiPoweredOpportunityForecasting - A function that provides opportunity timeline predictions, completion date estimates, and bottleneck identification.
 * - AiPoweredOpportunityForecastingInput - The input type for the aiPoweredOpportunityForecasting function.
 * - AiPoweredOpportunityForecastingOutput - The return type for the aiPoweredOpportunityForecasting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPoweredOpportunityForecastingInputSchema = z.object({ // Renamed
  opportunityName: z.string().describe('The name of the opportunity.'), // Renamed
  opportunityDescription: z.string().describe('A detailed description of the opportunity.'), // Renamed
  opportunityTimeline: z.string().describe('The current timeline of the opportunity, including start and end dates.'), // Renamed
  opportunityValue: z.number().describe('The monetary value of the opportunity.'), // Renamed
  opportunityStatus: z.string().describe('The current status of the opportunity (e.g., Need Analysis, Negotiation).'), // Renamed
  recentUpdates: z.string().describe('A summary of recent updates and communications related to the opportunity.'),
});
export type AiPoweredOpportunityForecastingInput = z.infer<typeof AiPoweredOpportunityForecastingInputSchema>; // Renamed

const AiPoweredOpportunityForecastingOutputSchema = z.object({ // Renamed
  timelinePrediction: z.string().describe('Predicted timeline for the opportunity, including potential delays.'),
  completionDateEstimate: z.string().describe('Estimated completion date of the opportunity.'),
  revenueForecast: z.number().describe('Forecasted revenue based on the opportunity value.'),
  bottleneckIdentification: z.string().describe('Identified potential bottlenecks in the opportunity timeline.'),
});
export type AiPoweredOpportunityForecastingOutput = z.infer<typeof AiPoweredOpportunityForecastingOutputSchema>; // Renamed

export async function aiPoweredOpportunityForecasting(input: AiPoweredOpportunityForecastingInput): Promise<AiPoweredOpportunityForecastingOutput> { // Renamed
  return aiPoweredOpportunityForecastingFlow(input); // Renamed
}

const prompt = ai.definePrompt({
  name: 'aiPoweredOpportunityForecastingPrompt', // Renamed
  input: {schema: AiPoweredOpportunityForecastingInputSchema}, // Renamed
  output: {schema: AiPoweredOpportunityForecastingOutputSchema}, // Renamed
  prompt: `You are an AI assistant that provides opportunity timeline predictions, completion date estimates, revenue forecasts, and potential bottleneck identification based on the provided opportunity information.

  Opportunity Name: {{{opportunityName}}}
  Opportunity Description: {{{opportunityDescription}}}
  Opportunity Timeline: {{{opportunityTimeline}}}
  Opportunity Value: {{{opportunityValue}}}
  Opportunity Status: {{{opportunityStatus}}}
  Recent Updates: {{{recentUpdates}}}

  Provide your analysis in a structured format.
  `,
});

const aiPoweredOpportunityForecastingFlow = ai.defineFlow( // Renamed
  {
    name: 'aiPoweredOpportunityForecastingFlow', // Renamed
    inputSchema: AiPoweredOpportunityForecastingInputSchema, // Renamed
    outputSchema: AiPoweredOpportunityForecastingOutputSchema, // Renamed
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
