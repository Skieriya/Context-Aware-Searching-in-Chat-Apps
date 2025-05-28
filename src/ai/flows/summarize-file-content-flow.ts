
'use server';
/**
 * @fileOverview An AI flow to generate a brief summary for file content.
 *
 * - summarizeFileContent - A function that handles the file summarization process.
 * - SummarizeFileContentInput - The input type for the summarizeFileContent function.
 * - SummarizeFileContentOutput - The return type for the summarizeFileContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeFileContentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The content of the file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The original name of the file.'),
});
export type SummarizeFileContentInput = z.infer<typeof SummarizeFileContentInputSchema>;

const SummarizeFileContentOutputSchema = z.object({
  summary: z.string().describe('A concise, two-line summary or context of the file content.'),
});
export type SummarizeFileContentOutput = z.infer<typeof SummarizeFileContentOutputSchema>;

export async function summarizeFileContent(
  input: SummarizeFileContentInput
): Promise<SummarizeFileContentOutput> {
  return summarizeFileContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeFileContentPrompt',
  input: {schema: SummarizeFileContentInputSchema},
  output: {schema: SummarizeFileContentOutputSchema},
  prompt: `You are an AI assistant. Your task is to provide a concise, two-line summary or context for the given file content. This summary will be primarily used for logging purposes.

File Name: {{{fileName}}}
File Content: {{media url=fileDataUri}}

Summary:`,
});

const summarizeFileContentFlow = ai.defineFlow(
  {
    name: 'summarizeFileContentFlow',
    inputSchema: SummarizeFileContentInputSchema,
    outputSchema: SummarizeFileContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
