
'use server';
/**
 * @fileOverview An AI flow to extract lead information from a business card image.
 *
 * - extractLeadInfoFromCard - A function that takes an image data URI of a business card and returns extracted lead details.
 * - ExtractLeadInfoInput - The input type for the extractLeadInfoFromCard function.
 * - ExtractedLeadInfoSchema - The Zod schema for the extracted lead information. (Type is ExtractedLeadInfo from @/types)
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ExtractedLeadInfo } from '@/types'; // Using the existing type

const ExtractLeadInfoInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a business card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractLeadInfoInput = z.infer<typeof ExtractLeadInfoInputSchema>;

// Define the Zod schema for the output, matching the ExtractedLeadInfo type
const ExtractedLeadInfoSchema = z.object({
  personName: z.string().optional().describe('The full name of the person on the business card.'),
  companyName: z.string().optional().describe('The name of the company on the business card.'),
  email: z.string().email().optional().describe('The email address found on the business card.'),
  phone: z.string().optional().describe('The phone number found on the business card.'),
});

export async function extractLeadInfoFromCard(input: ExtractLeadInfoInput): Promise<ExtractedLeadInfo | null> {
  return extractLeadInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractLeadFromCardPrompt',
  input: {schema: ExtractLeadInfoInputSchema},
  output: {schema: ExtractedLeadInfoSchema},
  prompt: `You are an expert Optical Character Recognition (OCR) and data extraction system specializing in business cards.
Analyze the provided image of a business card and extract the following information if available:
- Full name of the person
- Company name
- Email address
- Phone number

Prioritize accuracy. If a field is not clearly visible or discernible, omit it or return an empty string for that field rather than guessing.

Business Card Image: {{media url=imageDataUri}}

Return the extracted information as a JSON object matching the defined output schema.
Example output for a typical card:
{
  "personName": "John Doe",
  "companyName": "Acme Corp",
  "email": "john.doe@acme.com",
  "phone": "+1-555-123-4567"
}
If some information is missing, it might look like:
{
  "personName": "Jane Smith",
  "companyName": "Innovate Ltd."
}
`,
config: { // Added config for safety settings and potentially temperature
    temperature: 0.2, // Lower temperature for more deterministic extraction
    safetySettings: [ // Relax safety settings if they block legitimate card info (e.g. names, addresses)
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const extractLeadInfoFlow = ai.defineFlow(
  {
    name: 'extractLeadInfoFlow',
    inputSchema: ExtractLeadInfoInputSchema,
    outputSchema: ExtractedLeadInfoSchema.nullable(), // Allow null if extraction fails
  },
  async (input): Promise<ExtractedLeadInfo | null> => {
    try {
      const {output} = await prompt(input);
      return output || null; // Return null if output is undefined
    } catch (error) {
      console.error("Error in extractLeadInfoFlow:", error);
      // Depending on the error, you might want to return a specific error structure or just null
      return null;
    }
  }
);
