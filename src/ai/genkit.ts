import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import type {Plugin} from 'genkit';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const isGoogleApiKeyValid = GOOGLE_API_KEY && !GOOGLE_API_KEY.includes("YOUR_") && !GOOGLE_API_KEY.includes("PLACEHOLDER") && !GOOGLE_API_KEY.includes("MOCK_") && GOOGLE_API_KEY.length > 10;

const plugins: Plugin<any>[] = [];

if (isGoogleApiKeyValid) {
  plugins.push(googleAI());
  console.info("Genkit: Initializing with Google AI plugin using provided GOOGLE_API_KEY.");
} else {
  console.warn("Genkit: GOOGLE_API_KEY is missing, a placeholder, or invalid. Genkit AI features will be disabled or limited. Provide a valid key in .env for AI functionality.");
  // Optionally, add a mock plugin or a very basic text-only plugin if Genkit requires at least one.
  // For now, initializing with an empty array if no valid key, which might limit Genkit's capabilities
  // or cause errors if `ai.generate()` is called without a configured model.
}

export const ai = genkit({
  plugins: plugins,
  // Define a default model only if the Google AI plugin is likely to be active
  // Otherwise, attempting to use a googleai model without the plugin will fail.
  // The application code calling ai.generate() should handle cases where no model is available.
  ...(isGoogleApiKeyValid ? { model: 'googleai/gemini-2.0-flash' } : {}),
});
