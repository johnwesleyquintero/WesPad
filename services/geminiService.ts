import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Creates a new Gemini client instance.
 * Prioritizes the user-provided key, falling back to process.env if available (dev mode).
 */
const getClient = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("Missing API Key. Please configure it in Settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * rewrites the selected text to be more concise and professional.
 */
export const rewriteText = async (text: string, apiKey?: string): Promise<string> => {
  if (!text.trim()) return "";
  
  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Rewrite the following text to be more clear, concise, and professional. maintain the original meaning. Only return the rewritten text, no explanations.\n\nText: ${text}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    throw error;
  }
};

/**
 * Summarizes the provided text.
 */
export const summarizeText = async (text: string, apiKey?: string): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Summarize the following text into a concise paragraph. Only return the summary.\n\nText: ${text}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Summarize Error:", error);
    throw error;
  }
};

/**
 * Generates text based on a user prompt.
 */
export const generateText = async (prompt: string, apiKey?: string): Promise<string> => {
  if (!prompt.trim()) return "";

  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    throw error;
  }
};
