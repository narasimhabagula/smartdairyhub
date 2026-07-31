import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { askJerry } from "@/services/jerryAI";
import { matchNavIntent } from "@/services/jerryNav";
import { voiceTagFor, jt } from "@/services/translation";
import { speakText, cancelSpeech, createRecognizer, isRecognitionSupported, requestMicPermission, primeVoices } from "@/services/speech";
import { sanitizeInput } from "@/utils/formatter";
import {
  JERRY_LANG_KEY,
  MAX_INPUT_CHARS,
  createRateLimiter,
  detectLangCode,
  loadHistory,
  saveHistory,
  uid,
} from "@/utils/helper";
import type { JerryLangCode, JerryMessage, JerryStatus } from "@/types/jerry";
import { loadVoiceSettings, saveVoiceSettings } from "@/lib/tts";

export function useJerryBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<JerryMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<JerryStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [muted, setMuted] = useState(() => !loadVoiceSettings().enabled);
  const [lang, setLang] = useState<JerryLangCode>(() => {
    try {
      return (localStorage.getItem(JERRY_LANG_KEY) as JerryLangCode) || "en";
    } catch {
      return "en";
    }
  });

  const limiter = useMemo(() => createRateLimiter(12, 60_000), []);
  const abortRef = useRef<AbortController | null>(null);
  const recognizerRef = useRef<ReturnType<typeof createRecognizer> | null>(null);

  useEffect(() => primeVoices(), []);
  useEffect(() => saveHistory(messages), [messages]);
  useEffect(() => {
    try {
      localStorage.setItem(JERRY_LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const changeLanguage = useCallback((code: JerryLangCode) => {
    setLang(code);
    cancelSpeech();
    setSpeaking(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    cancelSpeech();
    setSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const settings = loadVoiceSettings();
      saveVoiceSettings({ ...settings, enabled: !next });
      if (next) {
        cancelSpeech();
        setSpeaking(false);
      }
      return next;
    });
  }, []);

  const speakReply = useCallback(
    (text: string, replyLang: JerryLangCode) => {
      if (muted || !text) return;
      speakText(text, voiceTagFor(replyLang), {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    [muted],
  );

  const send = useCallback(
    async (rawText?: string, images?: string[]) => {
      const clean = sanitizeInput(rawText ?? input).slice(0, MAX_INPUT_CHARS);
      if (!clean || status === "thinking" || status === "streaming") return;
      if (!limiter.take()) {
        setError(jt(lang, "tooFast"));
        return;
      }

      setError(null);
      setInput("");
      setInterim("");
      cancelSpeech();
      setSpeaking(false);

      const detected = detectLangCode(clean);
      const replyLang = detected !== "en" ? detected : lang;
      if (detected !== "en" && detected !== lang) setLang(detected);

      const userMsg: JerryMessage = { id: uid(), role: "user", content: clean, createdAt: Date.now(), images };
      const nextMessages = [...messages, userMsg];
      const assistantId = uid();
      setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);
      setStatus("thinking");

      const controller = new AbortController();
      abortRef.current = controller;
      let acc = "";

      try {
        await askJerry(nextMessages, replyLang, {
          signal: controller.signal,
          onDelta: (chunk) => {
            acc += chunk;
            setStatus("streaming");
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
            );
          },
        });
        setStatus("idle");
        speakReply(acc, replyLang);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Something went wrong.";
        if (message === "AbortError" || controller.signal.aborted) {
          setStatus("idle");
          return;
        }
        setStatus("error");
        setError(message === "AUTH_REQUIRED" ? jt(lang, "signIn") : message);
        setMessages((prev) => prev.filter((m) => !(m.id === assistantId && !m.content)));
      } finally {
        abortRef.current = null;
      }
    },
    [input, status, limiter, lang, messages, speakReply],
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const startListening = useCallback(async () => {
    if (!isRecognitionSupported()) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    const allowed = await requestMicPermission();
    if (!allowed) {
      setError("Microphone permission is required for voice input.");
      return;
    }
    cancelSpeech();
    setSpeaking(false);
    setError(null);
    const recognizer = createRecognizer(voiceTagFor(lang), {
      onResult: (finalText, interimText) => {
        setInterim(interimText);
        if (finalText) setInput(finalText);
      },
      onEnd: () => setListening(false),
      onError: (message) => {
        setError(message);
        setListening(false);
      },
    });
    recognizerRef.current = recognizer;
    recognizer?.start();
    setListening(true);
  }, [lang]);

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const replayLast = useCallback(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.content);
    if (last) speakReply(last.content, detectLangCode(last.content) !== "en" ? detectLangCode(last.content) : lang);
  }, [messages, speakReply, lang]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    cancelSpeech();
    setSpeaking(false);
    saveHistory([]);
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    recognizerRef.current?.abort();
    cancelSpeech();
  }, []);

  return {
    open,
    setOpen,
    messages,
    input,
    setInput,
    interim,
    status,
    error,
    setError,
    lang,
    changeLanguage,
    muted,
    toggleMute,
    speaking,
    stopSpeaking,
    replayLast,
    listening,
    startListening,
    stopListening,
    send,
    stopGenerating,
    clearChat,
    voiceSupported: isRecognitionSupported(),
  };
}

export type JerryBotApi = ReturnType<typeof useJerryBot>;
