import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Mic, MicOff, Volume2, VolumeX, Trash2, Download, Bot, Radio, Play, Pause, Square } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { setChatbotHidden, isChatbotHidden } from "@/components/ChatBot";
import { speak, cancelSpeech, pauseSpeech, resumeSpeech, primeVoices, loadVoiceSettings, saveVoiceSettings } from "@/lib/tts";
import { supabase } from "@/integrations/supabase/client";
import chatbotIcon from "@/assets/chatbot-icon.png";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_HIST = "sdh_chatbot_history_v1";

const SUGGESTIONS = [
  "Today's milk rate for cow milk with FAT 4.0 and SNF 8.5",
  "How to treat mastitis in cows?",
  "Find nearby veterinary doctors in my district",
  "Government dairy loan schemes (NABARD, PM Kisan)",
  "How do I list my cow for sale on Smart Dairy Hub?",
  "Where can I change my password?",
];

const LANG_OPTIONS = [
  { code: "en-IN", label: "English" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "mr-IN", label: "मराठी" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "or-IN", label: "ଓଡ଼ିଆ" },
  { code: "as-IN", label: "অসমীয়া" },
];

function detectLang(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN";
  if (/[\u0980-\u09FF]/.test(text)) return "bn-IN";
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa-IN";
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu-IN";
  if (/[\u0B00-\u0B7F]/.test(text)) return "or-IN";
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
  return "en-IN";
}

export default function AIChat() {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>(() => {
    try { const raw = sessionStorage.getItem(STORAGE_HIST); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialVoice = loadVoiceSettings();
  const [speakOn, setSpeakOn] = useState<boolean>(initialVoice.enabled);
  const [floatingEnabled, setFloatingEnabled] = useState(() => !isChatbotHidden());
  const [voiceLang, setVoiceLang] = useState<string>(() => {
    if (initialVoice.preferredLang) return initialVoice.preferredLang;
    const l = i18n.language || "en";
    const map: Record<string, string> = { te: "te-IN", hi: "hi-IN", ta: "ta-IN", ml: "ml-IN", kn: "kn-IN", mr: "mr-IN", bn: "bn-IN", pa: "pa-IN", gu: "gu-IN", or: "or-IN", as: "as-IN" };
    return map[l.slice(0, 2)] || "en-IN";
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const continuousRef = useRef(false);
  continuousRef.current = continuous;

  const { transcript, interimTranscript, listening, supported, start, stop, reset } = useSpeechRecognition(voiceLang);

  useEffect(() => { primeVoices(); }, []);

  // Persist voice settings whenever they change in this page
  useEffect(() => {
    const cur = loadVoiceSettings();
    saveVoiceSettings({ ...cur, enabled: speakOn, preferredLang: voiceLang });
    if (!speakOn) { cancelSpeech(); setSpeaking(false); }
  }, [speakOn, voiceLang]);

  // Append final transcripts to input. In continuous mode, auto-send after a brief silence.
  useEffect(() => {
    if (!transcript) return;
    setInput((p) => (p ? p + " " : "") + transcript);
    // Barge-in: cancel TTS the moment user speaks
    if (speaking) { cancelSpeech(); setSpeaking(false); setPaused(false); }
    if (continuousRef.current) {
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = window.setTimeout(() => { void send(); }, 1100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // Barge-in: cancel TTS on first interim sound too
  useEffect(() => {
    if (interimTranscript && speaking) { cancelSpeech(); setSpeaking(false); }
  }, [interimTranscript, speaking]);

  useEffect(() => { sessionStorage.setItem(STORAGE_HIST, JSON.stringify(messages.slice(-50))); }, [messages]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading]);

  // Continuous mode: keep mic open across turns
  useEffect(() => {
    if (continuous && supported && !listening) start();
    if (!continuous && listening) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuous, supported]);

  const toggleFloating = (enabled: boolean) => {
    setFloatingEnabled(enabled);
    setChatbotHidden(!enabled);
  };

  // Voice control: Start / Pause-Resume / Stop
  const lastAssistant = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant" && m.content)?.content || "",
    [messages]
  );
  const handleVoiceStart = () => {
    if (speaking && paused) { resumeSpeech(); setPaused(false); return; }
    if (speaking) return;
    if (!lastAssistant) return;
    const lang = detectLang(lastAssistant) !== "en-IN" ? detectLang(lastAssistant) : voiceLang;
    speak(lastAssistant, lang, {
      onStart: () => { setSpeaking(true); setPaused(false); },
      onEnd: () => { setSpeaking(false); setPaused(false); },
      onError: () => { setSpeaking(false); setPaused(false); },
    });
  };
  const handleVoicePause = () => {
    if (speaking && !paused) { pauseSpeech(); setPaused(true); }
    else if (speaking && paused) { resumeSpeech(); setPaused(false); }
  };
  const handleVoiceStop = () => {
    cancelSpeech();
    setSpeaking(false);
    setPaused(false);
  };

  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    if (silenceTimerRef.current) { window.clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    setError(null);
    setInput("");
    reset();
    const detected = detectLang(text);
    if (detected !== "en-IN") setVoiceLang(detected);

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to use the AI assistant.");
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
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
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
            }
          } catch {}
        }
      }
      if (speakOn && acc) {
        const replyLang = detectLang(acc) !== "en-IN" ? detectLang(acc) : detected;
        speak(acc, replyLang, {
          onStart: () => setSpeaking(true),
          onEnd: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }
    } catch (e: any) {
      setError(e?.message || "Failed to reach assistant");
      setMessages((m) => { const c = [...m]; if (c[c.length - 1]?.role === "assistant" && !c[c.length - 1].content) c.pop(); return c; });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, reset, speakOn]);

  const clearChat = () => {
    if (!confirm("Clear all conversation history?")) return;
    setMessages([]);
    sessionStorage.removeItem(STORAGE_HIST);
    cancelSpeech();
    setSpeaking(false);
  };

  const exportChat = () => {
    const text = messages.map((m) => `${m.role === "user" ? "You" : "Dairy Mitra"}: ${m.content}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dairy-mitra-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const greeting = useMemo(() => {
    const lang = voiceLang.split("-")[0];
    const map: Record<string, string> = {
      te: "నమస్తే! నేను డెయిరీ మిత్ర. మీకు ఎలా సహాయం చేయాలి?",
      hi: "नमस्ते! मैं डेयरी मित्र हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
      ta: "வணக்கம்! நான் டெய்ரி மித்ரா. நான் எப்படி உதவ முடியும்?",
      ml: "നമസ്കാരം! ഞാൻ ഡെയറി മിത്ര.",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ಡೈರಿ ಮಿತ್ರ.",
    };
    return map[lang] || "Hello! I'm Dairy Mitra — your AI dairy farming assistant. Ask me anything in your language.";
  }, [voiceLang]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/20">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="relative">
            <img src={chatbotIcon} alt="" className="h-10 w-10 rounded-full bg-white object-cover ring-2 ring-primary/30" />
            {speaking && <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-primary" /></span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold">Smart Dairy Hub AI Assistant</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              {speaking ? <span className="text-primary font-medium">Speaking…</span> : loading ? "Thinking…" : "Online"}
              <span>•</span>
              <span>{LANG_OPTIONS.find((l) => l.code === voiceLang)?.label}</span>
            </div>
          </div>
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            aria-label="Language"
          >
            {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button onClick={() => setSpeakOn((v) => !v)} className="rounded p-2 hover:bg-muted" title={speakOn ? "Mute voice" : "Enable voice"}>
            {speakOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button onClick={exportChat} className="rounded p-2 hover:bg-muted" title="Export chat" disabled={!messages.length}>
            <Download className="h-4 w-4" />
          </button>
          <button onClick={clearChat} className="rounded p-2 hover:bg-muted" title="Clear chat" disabled={!messages.length}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto mt-2 flex max-w-5xl flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span>Enable Floating Chatbot</span>
          </div>
          <Switch checked={floatingEnabled} onCheckedChange={toggleFloating} />
          {supported && (
            <>
              <div className="flex items-center gap-2 border-l pl-3">
                <Radio className={`h-4 w-4 ${continuous ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                <span>Continuous voice</span>
              </div>
              <Switch checked={continuous} onCheckedChange={(v) => { setContinuous(v); if (!v) cancelSpeech(); }} />
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-5xl space-y-3">
          {messages.length === 0 && (
            <>
              <div className="rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-sm shadow-sm">{greeting}</div>
              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)} className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary/5">
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-card"}`}>
                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex gap-1 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                  )
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            </div>
          ))}
          {interimTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/60 px-4 py-2 text-sm italic text-primary-foreground shadow-sm">
                {interimTranscript}…
              </div>
            </div>
          )}
          {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
        </div>
      </div>

      {/* Voice Control Bar — Start / Pause / Stop */}
      <div className="border-t border-border bg-background px-3 py-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Volume2 className={`h-4 w-4 ${speaking && !paused ? "text-primary animate-pulse" : ""}`} />
            <span className="font-medium">
              {!speakOn ? "Voice muted" : speaking ? (paused ? "Paused" : "Speaking…") : "Voice ready"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleVoiceStart}
              disabled={!speakOn || !lastAssistant || (speaking && !paused)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              title={speaking && paused ? "Resume" : "Play last reply"}
              aria-label="Start speaking"
            >
              <Play className="h-3.5 w-3.5" /> {speaking && paused ? "Resume" : "Start"}
            </button>
            <button
              type="button"
              onClick={handleVoicePause}
              disabled={!speaking}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-40"
              title={paused ? "Resume" : "Pause"}
              aria-label="Pause speaking"
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
            <button
              type="button"
              onClick={handleVoiceStop}
              disabled={!speaking}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-40"
              title="Stop"
              aria-label="Stop speaking"
            >
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
            {supported && (
              <button
                type="button"
                onClick={() => { if (listening) stop(); else { cancelSpeech(); setSpeaking(false); setPaused(false); start(); } }}
                className={`ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${listening ? "bg-red-500 text-white animate-pulse" : "border border-border bg-background hover:bg-muted"}`}
                title={listening ? "Stop listening" : "Start microphone"}
                aria-label={listening ? "Stop microphone" : "Start microphone"}
              >
                {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {listening ? "Listening" : "Mic"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background p-3">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Ask in any Indian language… (Telugu, Hindi, English, Tamil…)"
              className="max-h-32 flex-1 resize-none bg-transparent text-sm outline-none"
            />
            {supported && (
              <button
                type="button"
                onClick={() => { if (listening) stop(); else { cancelSpeech(); setSpeaking(false); start(); } }}
                className={`shrink-0 rounded-lg p-2 transition ${listening ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:bg-muted"}`}
                title={listening ? "Stop" : `Speak in ${LANG_OPTIONS.find((l) => l.code === voiceLang)?.label}`}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="shrink-0 rounded-lg bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            AI may make mistakes. For serious illness or emergencies, please contact a qualified veterinarian.
          </p>
        </div>
      </div>
    </div>
  );
}
