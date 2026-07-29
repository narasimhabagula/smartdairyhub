// Shared types for Jerry — Smart Dairy Assistant.

export type JerryRole = "user" | "assistant";

export type JerryMessage = {
  id: string;
  role: JerryRole;
  content: string;
  createdAt: number;
  /** Optional image data URLs attached by the user (disease detection flow). */
  images?: string[];
};

export type JerryLangCode = "en" | "te" | "hi" | "ta" | "kn" | "ml";

export type JerryLanguage = {
  code: JerryLangCode;
  label: string;
  /** BCP-47 tag used for speech recognition + synthesis. */
  voice: string;
};

export type JerryStatus = "idle" | "thinking" | "streaming" | "error";

export type JerrySuggestion = {
  id: string;
  label: string;
  prompt: string;
};

/** Provider-based AI architecture — swap the provider without touching the UI. */
export type JerryProviderName = "lovable" | "gemini" | "openai" | "claude" | "groq" | "openrouter";

export type JerryStreamHandlers = {
  onDelta: (chunk: string) => void;
  onDone?: (full: string) => void;
  signal?: AbortSignal;
};

export type JerryAIProvider = {
  name: JerryProviderName;
  /** Streams an assistant reply for the given conversation. */
  stream: (messages: JerryMessage[], lang: JerryLangCode, handlers: JerryStreamHandlers) => Promise<string>;
};
