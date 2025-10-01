'use server';
/**
 * @fileOverview AI flow to generate realistic menu items.
 *
 * - generateMenuItems - A function that generates a list of menu items for a given category.
 * - GenerateMenuItemsInput - The input type for the generateMenuItems function.
 * - GenerateMenuItemsOutput - The return type for the generateMenuItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const GeneratedMenuItemSchema = z.object({
  name: z.string().describe('The name of the menu item.'),
  description: z.string().describe('A brief, appealing description of the item.'),
  price: z.number().describe('The price of the item in Indonesian Rupiah (IDR). Should be a reasonable, rounded number.'),
  image: z.string().describe('A simple, two or three-word search query for a placeholder image of the item (e.g., "cheese pizza", "iced coffee").'),
});

export const GenerateMenuItemsInputSchema = z.object({
  category: z.string().describe('The menu category for which to generate items (e.g., "Coffee Based", "Food", "Desserts").'),
  count: z.number().describe('The number of menu items to generate.'),
  existingItems: z.array(z.string()).describe('A list of existing menu item names to avoid generating duplicates.'),
  companyName: z.string().describe('The name of the coffee shop.'),
});
export type GenerateMenuItemsInput = z.infer<typeof GenerateMenuItemsInputSchema>;

export const GenerateMenuItemsOutputSchema = z.object({
  items: z.array(GeneratedMenuItemSchema),
});
export type GenerateMenuItemsOutput = z.infer<typeof GenerateMenuItemsOutputSchema>;


export async function generateMenuItems(input: GenerateMenuItemsInput): Promise<GenerateMenuItemsOutput> {
    const result = await generateMenuItemsFlow(input);
    // Basic validation
    if (!result || !Array.isArray(result.items)) {
        throw new Error("Invalid output from AI flow");
    }
    return result;
}

const prompt = ai.definePrompt({
  name: 'generateMenuItemsPrompt',
  input: {schema: GenerateMenuItemsInputSchema},
  output: {schema: GenerateMenuItemsOutputSchema},
  prompt: `You are an expert menu consultant for a modern Indonesian coffee shop named "{{companyName}}".
Your task is to generate a list of {{{count}}} unique and appealing menu items for the '{{{category}}}' category.

Avoid generating items that are already on the menu.
Existing items:
{{#each existingItems}}
- {{{this}}}
{{/each}}

For each item, provide a name, a short description, a realistic price in IDR (e.g., 35000, 55000, not 35520), and a simple 2-3 word image search query.
The items should be creative but appropriate for a coffee shop setting.
Generate exactly {{{count}}} items.
`,
});

const generateMenuItemsFlow = ai.defineFlow(
  {
    name: 'generateMenuItemsFlow',
    inputSchema: GenerateMenuItemsInputSchema,
    outputSchema: GenerateMenuItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-pro') });
    return output!;
  }
);