// Provider-based AI layer for Jerry.
// The UI only ever talks to `getJerryProvider()`, so swapping in Gemini / OpenAI /
// Claude / Groq / OpenRouter later means adding a provider here — no UI changes.
// API keys NEVER live in the frontend: every provider must call a server endpoint.
import { supabase } from "@/integrations/supabase/client";
import type { JerryAIProvider, JerryLangCode, JerryMessage, JerryProviderName, JerryStreamHandlers } from "@/types/jerry";
import { languageName } from "@/services/translation";
import { MAX_HISTORY } from "@/utils/helper";

const MAX_MESSAGE_CHARS = 4000;

function toWireMessages(messages: JerryMessage[], lang: JerryLangCode) {
  const wire = messages.slice(-MAX_HISTORY).map((m) => {
    const text = m.content.slice(0, MAX_MESSAGE_CHARS);
    if (m.images?.length) {
      return {
        role: m.role,
        content: [
          { type: "text", text },
          ...m.images.slice(0, 4).map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      };
    }
    return { role: m.role, content: text };
  });
  // Language steer as part of the final user turn (server owns the system prompt).
  const last = wire[wire.length - 1];
  if (last && last.role === "user" && typeof last.content === "string") {
    last.content = `${last.content}\n\n(Reply entirely in ${languageName(lang)}.)`;
  }
  return wire;
}

/** Parses an OpenAI-style SSE stream. */
async function readSSE(body: ReadableStream<Uint8Array>, onDelta: (s: string) => void): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          acc += delta;
          onDelta(delta);
        }
      } catch {
        /* partial JSON frame — ignored */
      }
    }
  }
  return acc;
}

/**
 * Default provider: Lovable AI (secure server function).
 * The key lives server-side; the browser only sends the user's session token.
 */
const lovableProvider: JerryAIProvider = {
  name: "lovable",
  async stream(messages, lang, handlers: JerryStreamHandlers) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("AUTH_REQUIRED");

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: toWireMessages(messages, lang) }),
      signal: handlers.signal,
    });

    if (res.status === 401) throw new Error("AUTH_REQUIRED");
    if (res.status === 429) throw new Error("Jerry is busy right now. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please contact support.");
    if (!res.ok || !res.body) throw new Error("Jerry could not be reached. Please check your connection.");

    const full = await readSSE(res.body, handlers.onDelta);
    handlers.onDone?.(full);
    return full;
  },
};

const providers: Partial<Record<JerryProviderName, JerryAIProvider>> = {
  lovable: lovableProvider,
  // Future: gemini / openai / claude / groq / openrouter — register a provider that
  // calls its own server endpoint and returns an OpenAI-style SSE stream.
};

let active: JerryProviderName = "lovable";

export function setJerryProvider(name: JerryProviderName) {
  if (providers[name]) active = name;
}

export function getJerryProvider(): JerryAIProvider {
  return providers[active] ?? lovableProvider;
}

export async function askJerry(
  messages: JerryMessage[],
  lang: JerryLangCode,
  handlers: JerryStreamHandlers,
): Promise<string> {
  return getJerryProvider().stream(messages, lang, handlers);
}
