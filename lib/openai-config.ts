import { openai } from "@ai-sdk/openai";

// OpenAI configuration with support for custom baseURL
export const openaiConfig = openai({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || undefined, // Optional custom baseURL
});

// Re-export for backwards compatibility and easier imports
export { openaiConfig as openai };