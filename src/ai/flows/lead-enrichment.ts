import { defineFlow } from 'genkit';
import { z } from 'zod';
import { ai } from '../genkit';
import { User, Lead } from '../../types';

export const leadEnrichmentFlow = defineFlow(
  {
    name: 'leadEnrichmentFlow',
    inputSchema: z.object({
      lead: z.custom<Lead>(),
      user: z.custom<User>(),
    }),
    outputSchema: z.object({
      recommendations: z.array(z.string()),
      pitchNotes: z.string(),
      useCase: z.string(),
    }),
  },
  async ({ lead, user }) => {
    const prompt = `
      You are an expert sales assistant. Your user is ${user.name}.
      Analyze the following lead and provide tailored sales assets.

      Lead Information:
      - Name: ${lead.personName}
      - Company: ${lead.companyName}
      - Country: ${lead.country || 'N/A'}
      
      Based on this, generate the following:
      1.  **Recommendations**: Suggest 3-4 specific services or products that would be a good fit for this lead. Present them as a JSON array of strings.
      2.  **Pitch Notes**: Provide concise, actionable talking points for a sales pitch.
      3.  **Use Case**: Describe a compelling use case for this lead.

      Format the output as a valid JSON object with the keys "recommendations", "pitchNotes", and "useCase".
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: 0.5,
      },
    });

    try {
      const generatedContent = JSON.parse(llmResponse.text());
      return generatedContent;
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("AI response was not valid JSON.");
    }
  }
); 