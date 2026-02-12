import { useState, useEffect, useRef, useCallback } from "react";
import { Chat } from "@google/genai";
import * as geminiService from "../services/geminiService";

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  isError?: boolean;
  isAuthError?: boolean;
  isStreaming?: boolean;
}

export const useAI = (apiKey: string) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hi! I'm your writing assistant. Select text to rewrite, or click 'Continue' to keep writing.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  // Abort Control
  const abortRef = useRef<boolean>(false);

  const initSession = useCallback(() => {
    let envKey = "";
    try {
      if (
        typeof process !== "undefined" &&
        process.env &&
        process.env.API_KEY
      ) {
        envKey = process.env.API_KEY;
      }
    } catch {
      /* ignore */
    }

    if (apiKey || envKey) {
      try {
        const session = geminiService.createChatSession(
          apiKey,
          "You are a helpful, concise writing assistant embedded in a Markdown editor. Keep answers brief and relevant to writing tasks.",
        );
        setChatSession(session);
      } catch (e) {
        console.error("Failed to init chat", e);
        setChatSession(null);
      }
    } else {
      setChatSession(null);
    }
  }, [apiKey]);

  // Initialize Chat Session
  useEffect(() => {
    initSession();
  }, [initSession]);

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: "Chat cleared. Ready for new ideas!",
      },
    ]);
    // Re-init session to clear context history
    initSession();
  };

  const stopGeneration = () => {
    if (isLoading) {
      abortRef.current = true;
    }
  };

  const sendMessage = async (text: string, context?: string, tone?: string) => {
    if (!text.trim()) return;

    const timestamp = Date.now();
    const userMsg: Message = { id: `user-${timestamp}`, role: "user", text };

    // Offline Check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `error-${timestamp}`,
          role: "model",
          text: "**Offline Mode**\n\nI cannot process requests while you are offline. Please check your internet connection.",
          isError: true,
        },
      ]);
      return;
    }

    // Config Check
    if (!chatSession) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `auth-error-${timestamp}`,
          role: "model",
          text: "**Setup Required**\n\nPlease configure your Google Gemini API key in Settings to continue.",
          isError: true,
          isAuthError: true,
        },
      ]);
      return;
    }

    setIsLoading(true);
    abortRef.current = false; // Reset abort flag
    setMessages((prev) => [...prev, userMsg]);

    // Construct Prompt
    let fullPrompt = "";
    const toneInstruction = tone ? `Adopt a ${tone.toLowerCase()} tone.` : "";

    if (context) {
      fullPrompt = `Context:\n"""\n${context}\n"""\n\n${toneInstruction}\nTask: ${text}`;
    } else {
      fullPrompt = `${toneInstruction}\nTask: ${text}`;
    }

    try {
      const responseStream = await chatSession.sendMessageStream({
        message: fullPrompt,
      });

      const responseId = `model-${timestamp}`;
      // Add placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: responseId,
          role: "model",
          text: "",
          isStreaming: true,
        },
      ]);

      let accumulatedText = "";

      for await (const chunk of responseStream) {
        if (abortRef.current) {
          // User clicked stop
          break;
        }

        const newText = chunk.text || "";
        accumulatedText += newText;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === responseId ? { ...msg, text: accumulatedText } : msg,
          ),
        );
      }

      // Finalize
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === responseId
            ? {
                ...msg,
                isStreaming: false,
                text: accumulatedText + (abortRef.current ? " [Stopped]" : ""),
              }
            : msg,
        ),
      );
    } catch (e) {
      console.error(e);
      let errorText = "Something went wrong.";
      let isAuthError = false;

      const err = e as { message?: string; status?: number };

      if (
        err.message?.includes("API key") ||
        err.status === 400 ||
        err.status === 403
      ) {
        errorText =
          "**Authentication Failed**\n\nYour API Key appears to be invalid or has expired.";
        isAuthError = true;
      } else if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.message?.includes("network")
      ) {
        errorText =
          "**Network Error**\n\nUnable to reach Google's servers. Please check your connection.";
      } else {
        errorText = `**Error**\n\n${err.message || "An unexpected error occurred."}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: errorText,
          isError: true,
          isAuthError,
        },
      ]);
    } finally {
      setIsLoading(false);
      abortRef.current = false;
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    stopGeneration,
    hasKey: !!chatSession,
  };
};
