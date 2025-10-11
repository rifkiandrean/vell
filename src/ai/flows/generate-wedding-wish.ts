'use server';

/**
 * @fileOverview Alur untuk menghasilkan ucapan pernikahan.
 *
 * - generateWeddingWish - Fungsi yang menghasilkan ucapan pernikahan berdasarkan kata kunci.
 * - GenerateWeddingWishInput - Tipe input untuk fungsi generateWeddingWish.
 * - GenerateWeddingWishOutput - Tipe output untuk fungsi generateWeddingWish.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeddingWishInputSchema = z.object({
  keywords: z
    .string()
    .describe('Kata kunci untuk inspirasi ucapan pernikahan, dipisahkan dengan koma.'),
});
export type GenerateWeddingWishInput = z.infer<
  typeof GenerateWeddingWishInputSchema
>;

const GenerateWeddingWishOutputSchema = z.object({
  wish: z.string().describe('Ucapan pernikahan yang dihasilkan.'),
});
export type GenerateWeddingWishOutput = z.infer<
  typeof GenerateWeddingWishOutputSchema
>;

export async function generateWeddingWish(
  input: GenerateWeddingWishInput
): Promise<GenerateWeddingWishOutput> {
  return generateWeddingWishFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWeddingWishPrompt',
  input: {schema: GenerateWeddingWishInputSchema},
  output: {schema: GenerateWeddingWishOutputSchema},
  prompt: `Anda adalah generator ucapan pernikahan. Buat ucapan pernikahan yang tulus berdasarkan kata kunci berikut: {{{keywords}}}. Ucapannya harus singkat dan mengungkapkan harapan baik untuk pasangan.`,
});

const generateWeddingWishFlow = ai.defineFlow(
  {
    name: 'generateWeddingWishFlow',
    inputSchema: GenerateWeddingWishInputSchema,
    outputSchema: GenerateWeddingWishOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
