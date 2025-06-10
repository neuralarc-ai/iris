// Implemented AI-powered forecasting flow to provide project timeline predictions, completion date estimates, and bottleneck identification.

'use server';

/**
 * @fileOverview Implements AI-powered forecasting features for project management.
 *
 * - aiPoweredForecasting - A function that provides project timeline predictions, completion date estimates, and bottleneck identification.
 * - AiPoweredForecastingInput - The input type for the aiPoweredForecasting function.
 * - AiPoweredForecastingOutput - The return type for the aiPoweredForecasting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPoweredForecastingInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  projectDescription: z.string().describe('A detailed description of the project.'),
  projectTimeline: z.string().describe('The current timeline of the project, including start and end dates.'),
  projectValue: z.number().describe('The monetary value of the project.'),
  projectStatus: z.string().describe('The current status of the project (e.g., Need Analysis, Negotiation).'),
  recentUpdates: z.string().describe('A summary of recent updates and communications related to the project.'),
});
export type AiPoweredForecastingInput = z.infer<typeof AiPoweredForecastingInputSchema>;

const AiPoweredForecastingOutputSchema = z.object({
  timelinePrediction: z.string().describe('Predicted timeline for the project, including potential delays.'),
  completionDateEstimate: z.string().describe('Estimated completion date of the project.'),
  revenueForecast: z.number().describe('Forecasted revenue based on the project value.'),
  bottleneckIdentification: z.string().describe('Identified potential bottlenecks in the project timeline.'),
});
export type AiPoweredForecastingOutput = z.infer<typeof AiPoweredForecastingOutputSchema>;

export async function aiPoweredForecasting(input: AiPoweredForecastingInput): Promise<AiPoweredForecastingOutput> {
  return aiPoweredForecastingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredForecastingPrompt',
  input: {schema: AiPoweredForecastingInputSchema},
  output: {schema: AiPoweredForecastingOutputSchema},
  prompt: `You are an AI assistant that provides project timeline predictions, completion date estimates, revenue forecasts, and potential bottleneck identification based on the provided project information.

  Project Name: {{{projectName}}}
  Project Description: {{{projectDescription}}}
  Project Timeline: {{{projectTimeline}}}
  Project Value: {{{projectValue}}}
  Project Status: {{{projectStatus}}}
  Recent Updates: {{{recentUpdates}}}

  Provide your analysis in a structured format.
  `,
});

const aiPoweredForecastingFlow = ai.defineFlow(
  {
    name: 'aiPoweredForecastingFlow',
    inputSchema: AiPoweredForecastingInputSchema,
    outputSchema: AiPoweredForecastingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
