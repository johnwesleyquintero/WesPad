import { GoogleGenAI, Chat } from "@google/genai";

const MODEL_NAME = "gemini-3-flash-preview";

/**
 * Safely retrieves the API key from the environment if available.
 */
const getEnvApiKey = (): string | undefined => {
  try {
    // Check if process is defined (node/shim)
    if (typeof process !== "undefined" && process.env) {
      return process.env.API_KEY;
    }
    // Check if import.meta.env is defined (Vite)
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    }
  } catch {
    // Ignore errors in strict environments
  }
  return undefined;
};

/**
 * Creates a new Gemini client instance.
 * Prioritizes the user-provided key, falling back to environment variables.
 */
const getClient = (apiKey?: string) => {
  const key = apiKey || getEnvApiKey();
  if (!key) {
    throw new Error("Missing API Key. Please configure it in Settings.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Creates a stateful chat session.
 */
export const createChatSession = (
  apiKey?: string,
  systemInstruction?: string,
): Chat => {
  const ai = getClient(apiKey);
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction,
    },
  });
};

/**
 * rewrites the selected text to be more concise and professional.
 */
export const rewriteText = async (
  text: string,
  apiKey?: string,
): Promise<string> => {
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
export const summarizeText = async (
  text: string,
  apiKey?: string,
): Promise<string> => {
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
export const generateText = async (
  prompt: string,
  apiKey?: string,
): Promise<string> => {
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
