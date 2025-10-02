'use server';
/**
 * @fileOverview A flow to generate and send a daily audit report.
 *
 * - sendAuditReport - Generates a report and simulates sending it.
 * - SendAuditReportInput - The input type for the function.
 * - SendAuditReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';


const SendAuditReportInputSchema = z.object({
  systemCash: z.number().describe("Total cash revenue recorded by the system."),
  systemNonCash: z.number().describe("Total non-cash revenue recorded by the system."),
  systemTotal: z.number().describe("Total revenue recorded by the system."),
  realCash: z.number().describe("Total cash counted physically."),
  realNonCash: z.number().describe("Total non-cash counted physically."),
  realTotal: z.number().describe("Total revenue counted physically."),
  dateRange: z.string().describe("The date range for the audit report."),
  companyName: z.string().describe("The name of the coffee shop."),
});
export type SendAuditReportInput = z.infer<typeof SendAuditReportInputSchema>;

const SendAuditReportOutputSchema = z.object({
  report: z.string().describe('The full audit report formatted as an email body.'),
});
export type SendAuditReportOutput = z.infer<typeof SendAuditReportOutputSchema>;

export async function sendAuditReport(input: SendAuditReportInput): Promise<SendAuditReportOutput> {
  const result = await sendAuditReportFlow(input);
  
  // Here you would typically integrate with an email service like SendGrid or Nodemailer.
  // For this example, we will just log the report to the console and return it.
  console.log("Simulating email sending...");
  
  return result;
}

const prompt = ai.definePrompt({
  name: 'sendAuditReportPrompt',
  input: {schema: SendAuditReportInputSchema},
  output: {schema: SendAuditReportOutputSchema},
  prompt: `You are an assistant for "{{companyName}}". Your task is to generate a daily financial audit report email.
The audit has been completed and the numbers match perfectly.
The report should be sent to the Owner and Manager.
Format the output as a clean, professional email body. Use Indonesian.

Use the following data for the report:
- Date Range: {{{dateRange}}}
- System Cash: {{{systemCash}}}
- System Non-Cash: {{{systemNonCash}}}
- System Total: {{{systemTotal}}}
- Real Cash: {{{realCash}}}
- Real Non-Cash: {{{realNonCash}}}
- Real Total: {{{realTotal}}}

The email should have:
1. A clear subject line.
2. A brief opening stating that the daily audit for the given date range has been completed and the results are balanced.
3. A clear, tabulated summary of the comparison (System vs. Fisik) for Tunai, Non-Tunai, and Total.
4. A concluding sentence confirming that no discrepancies were found.
5. A professional closing.
`,
});

const sendAuditReportFlow = ai.defineFlow(
  {
    name: 'sendAuditReportFlow',
    inputSchema: SendAuditReportInputSchema,
    outputSchema: SendAuditReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: googleAI.model('gemini-1.5-flash-latest') });
    return output!;
  }
);
