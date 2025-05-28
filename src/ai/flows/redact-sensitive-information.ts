'use server';

/**
 * @fileOverview A privacy tool that scans messages for sensitive information using an LLM and redacts it before logging.
 *
 * - redactSensitiveInformation - A function that handles the redaction process.
 * - RedactSensitiveInformationInput - The input type for the redactSensitiveInformation function.
 * - RedactSensitiveInformationOutput - The return type for the redactSensitiveInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RedactSensitiveInformationInputSchema = z.object({
  message: z.string().describe('The message to redact sensitive information from.'),
});
export type RedactSensitiveInformationInput = z.infer<typeof RedactSensitiveInformationInputSchema>;

const RedactSensitiveInformationOutputSchema = z.object({
  redactedMessage: z.string().describe('The message with sensitive information redacted.'),
});
export type RedactSensitiveInformationOutput = z.infer<typeof RedactSensitiveInformationOutputSchema>;

export async function redactSensitiveInformation(
  input: RedactSensitiveInformationInput
): Promise<RedactSensitiveInformationOutput> {
  return redactSensitiveInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'redactSensitiveInformationPrompt',
  input: {schema: RedactSensitiveInformationInputSchema},
  output: {schema: RedactSensitiveInformationOutputSchema},
  prompt: `You are an AI assistant that redacts sensitive information from a given message.

  Your goal is to identify and redact any personally identifiable information (PII) or other sensitive data that should not be logged.

  Message: {{{message}}}

  Redacted Message:`, // The response should be the redacted message.
});

const redactSensitiveInformationFlow = ai.defineFlow(
  {
    name: 'redactSensitiveInformationFlow',
    inputSchema: RedactSensitiveInformationInputSchema,
    outputSchema: RedactSensitiveInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
