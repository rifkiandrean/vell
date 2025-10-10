'use server';
/**
 * @fileOverview An AI flow to recommend menu items based on a user's current order.
 *
 * - recommendMenuItems - A function that provides recommendations.
 * - RecommendMenuItemsInput - The input type for the function.
 * - RecommendMenuItemsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';


export const RecommendMenuItemsInputSchema = z.object({
  currentOrder: z.array(z.string()).describe("A list of items currently in the user's order."),
  companyName: z.string().describe("The name of the coffee shop"),
});
export type RecommendMenuItemsInput = z.infer<typeof RecommendMenuItemsInputSchema>;

export const RecommendMenuItemsOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of 2-3 recommended menu item names that would complement the current order.'),
  reasoning: z.string().describe('A short, friendly, one-sentence explanation for why these items are recommended, speaking directly to the customer.'),
});
export type RecommendMenuItemsOutput = z.infer<typeof RecommendMenuItemsOutputSchema>;

export async function recommendMenuItems(input: RecommendMenuItemsInput): Promise<RecommendMenuItemsOutput> {
  return recommendMenuItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendMenuItemsPrompt',
  input: {schema: RecommendMenuItemsInputSchema},
  output: {schema: RecommendMenuItemsOutputSchema},
  prompt: `You are a friendly barista at "{{companyName}}". A customer is ordering and you want to suggest something they might also like.
Based on their current order, recommend 2 or 3 other items from the menu.
Provide a short, friendly reason for your suggestion.

The full menu includes categories: Coffee Based, Milk Based, Juice, Mocktail, Food, Desserts.
You can recommend items from any category that would be a good pairing.

Customer's current order:
{{#each currentOrder}}
- {{{this}}}
{{/each}}
`,
});

const recommendMenuItemsFlow = ai.defineFlow(
  {
    name: 'recommendMenuItemsFlow',
    inputSchema: RecommendMenuItemsInputSchema,
    outputSchema: RecommendMenuItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-1.5-flash-latest') });
    return output!;
  }
);
