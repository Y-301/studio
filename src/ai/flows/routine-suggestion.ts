// src/ai/flows/routine-suggestion.ts
'use server';

/**
 * @fileOverview A routine suggestion AI agent.
 *
 * - suggestRoutine - A function that handles the routine suggestion process.
 * - SuggestRoutineInput - The input type for the suggestRoutine function.
 * - SuggestRoutineOutput - The return type for the suggestRoutine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRoutineInputSchema = z.object({
  weatherForecast: z.string().describe('The weather forecast for the current day.'),
  calendarEvents: z.string().describe('The user\'s calendar events for the current day.'),
  userPreferences: z.string().describe('The user\'s preferences for wake-up routines.'),
});
export type SuggestRoutineInput = z.infer<typeof SuggestRoutineInputSchema>;

const SuggestRoutineOutputSchema = z.object({
  routineSuggestion: z.string().describe('The AI suggested wake-up routine.'),
});
export type SuggestRoutineOutput = z.infer<typeof SuggestRoutineOutputSchema>;

export async function suggestRoutine(input: SuggestRoutineInput): Promise<SuggestRoutineOutput> {
  return suggestRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoutinePrompt',
  input: {schema: SuggestRoutineInputSchema},
  output: {schema: SuggestRoutineOutputSchema},
  prompt: `You are an AI assistant that suggests personalized wake-up routines based on the weather forecast, calendar events, and user preferences.

  Weather Forecast: {{{weatherForecast}}}
  Calendar Events: {{{calendarEvents}}}
  User Preferences: {{{userPreferences}}}

  Based on the information above, suggest a personalized wake-up routine for the user.
  The routine should include specific activities and timing.
  Be concise and provide actionable suggestions.
  `,
});

const suggestRoutineFlow = ai.defineFlow(
  {
    name: 'suggestRoutineFlow',
    inputSchema: SuggestRoutineInputSchema,
    outputSchema: SuggestRoutineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
