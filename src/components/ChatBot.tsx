import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { Send, X, Mic, MicOff, Minus, Sparkles, MessageCircle } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "react-i18next";
import chatbotIcon from "@/assets/chatbot-icon.png";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { emoji: "🥛", key: "milk_rate", q: "What is today's milk rate and how is it calculated from FAT & SNF?" },
  { emoji: "🐄", key: "cow_diseases", q: "Common cow diseases, symptoms and prevention" },
  { emoji: "🐃", key: "buffalo_care", q: "How to care for a pregnant buffalo?" },
  { emoji: "🌾", key: "feed", q: "Best balanced feed guide for dairy cows" },
  { emoji: "💰", key: "schemes", q: "Government dairy subsidies and loans I can apply for" },
  { emoji: "🩺", key: "vet", q: "How do I find a nearby veterinary doctor?" },
  { emoji: "🛒", key: "buy_sell", q: "How do I buy or sell cattle on Smart Dairy Hub?" },
  { emoji: "❓", key: "faq", q: "What is Smart Dairy Hub and what can I do here?" },
];

const STORAGE_POS = "sdh_chatbot_pos";
const STORAGE_HIST = "sdh_chatbot_history_v1";

function detectLang(text: string): "en-IN" | "te-IN" | "hi-IN" {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN";
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
  return "en-IN";
}

export default function ChatBot() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_HIST);
      return raw ? (JSON.parse(raw) as Msg[]) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNew, setHasNew] = useState(messages.length === 0);

  // Draggable position
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_POS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { x: window.innerWidth - 88, y: window.innerHeight - 110 };
  });
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const voiceLang =
    i18n.language?.startsWith("te") ? "te-IN" :
    i18n.language?.startsWith("hi") ? "hi-IN" : "en-IN";
  const { transcript, listening, supported, start, stop, reset } = useSpeechRecognition(voiceLang);

  useEffect(() => { if (transcript) setInput((p) => (p ? p + " " : "") + transcript); }, [transcript]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_HIST, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open, minimized]);

  // Keep within viewport on resize
  useEffect(() => {
    const onResize = () => {
      setPos((p) => ({
        x: Math.min(Math.max(8, p.x), window.innerWidth - 80),
        y: Math.min(Math.max(8, p.y), window.innerHeight - 80),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = e.clientX - dragRef.current.dx;
    const ny = e.clientY - dragRef.current.dy;
    if (Math.abs(nx - pos.x) + Math.abs(ny - pos.y) > 4) dragRef.current.moved = true;
    setPos({
      x: Math.min(Math.max(8, nx), window.innerWidth - 72),
      y: Math.min(Math.max(8, ny), window.innerHeight - 72),
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const moved = dragRef.current?.moved;
    dragRef.current = null;
    try { localStorage.setItem(STORAGE_POS, JSON.stringify(pos)); } catch {}
    if (!moved) {
      setOpen(true);
      setMinimized(false);
      setHasNew(false);
    }
  };

  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    reset();
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    // Add empty assistant placeholder
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }

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
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {}
        }
      }
      if (!open || minimized) setHasNew(true);
    } catch (e: any) {
      setError(e?.message || "Failed to reach assistant");
      setMessages((m) => {
        const copy = [...m];
        if (copy[copy.length - 1]?.role === "assistant" && !copy[copy.length - 1].content) copy.pop();
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open, minimized, reset]);

  const greetingLang = i18n.language?.startsWith("te") ? "te" : i18n.language?.startsWith("hi") ? "hi" : "en";
  const greeting =
    greetingLang === "te"
      ? "నమస్తే! నేను డెయిరీ మిత్ర 🐄. పాల ధరలు, పశు సంరక్షణ, వ్యాధులు, పథకాలు, మార్కెట్ గురించి అడగండి."
      : greetingLang === "hi"
      ? "नमस्ते! मैं डेयरी मित्र 🐄. दूध रेट, पशु देखभाल, बीमारियाँ, योजनाएँ, मार्केट के बारे में पूछें।"
      : "Namaste! I'm Dairy Mitra 🐄 — your AI assistant. Ask me about milk rates, animal care, diseases, schemes & the marketplace.";

  const ui = (
    <>
      {/* Floating button */}
      <button
        aria-label="Open chat assistant"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ left: pos.x, top: pos.y }}
        className={`fixed z-[9998] h-16 w-16 touch-none select-none rounded-full bg-white shadow-xl ring-2 ring-primary/30 transition-transform hover:scale-105 active:scale-95 sm:h-[72px] sm:w-[72px] ${open && !minimized ? "scale-0 pointer-events-none" : "scale-100"}`}
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20" />
        <img src={chatbotIcon} alt="Dairy Mitra" className="h-full w-full rounded-full object-cover" draggable={false} />
        {hasNew && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            <Sparkles className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className={`fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-200
            ${minimized ? "h-14 w-72" : "h-[70vh] max-h-[640px] w-[92vw] max-w-[400px] sm:h-[600px]"}
          `}
          style={{
            right: 16,
            bottom: 16,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-primary-foreground">
            <img src={chatbotIcon} alt="" className="h-9 w-9 rounded-full bg-white object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">Dairy Mitra</div>
              <div className="flex items-center gap-1.5 text-[11px] opacity-90">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
                AI Assistant • EN · తె · हि
              </div>
            </div>
            <button
              onClick={() => setMinimized((v) => !v)}
              className="rounded p-1.5 hover:bg-white/15"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setOpen(false); setMinimized(false); }}
              className="rounded p-1.5 hover:bg-white/15"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-4">
                {messages.length === 0 && (
                  <>
                    <div className="rounded-2xl rounded-tl-sm bg-card px-3 py-2 text-sm shadow-sm">
                      {greeting}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {QUICK_ACTIONS.map((a) => (
                        <button
                          key={a.key}
                          onClick={() => send(a.q)}
                          className="rounded-lg border border-border bg-card px-2 py-2 text-left text-xs font-medium transition hover:border-primary hover:bg-primary/5"
                        >
                          <span className="mr-1">{a.emoji}</span>
                          {a.q.split("?")[0].split(" ").slice(0, 5).join(" ")}…
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        m.role === "user"
                          ? "rounded-tr-sm bg-primary text-primary-foreground"
                          : "rounded-tl-sm bg-card"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        m.content ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_li]:my-0.5">
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

                {error && (
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border bg-background p-2">
                <div className="flex items-end gap-1.5 rounded-xl border border-border bg-card px-2 py-1.5 focus-within:border-primary">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder={
                      greetingLang === "te" ? "ఇక్కడ టైప్ చేయండి…" :
                      greetingLang === "hi" ? "यहाँ लिखें…" : "Ask anything about dairy…"
                    }
                    className="max-h-24 flex-1 resize-none bg-transparent text-sm outline-none"
                  />
                  {supported && (
                    <button
                      type="button"
                      onClick={() => (listening ? stop() : start())}
                      className={`shrink-0 rounded-lg p-2 transition ${listening ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:bg-muted"}`}
                      aria-label={listening ? "Stop voice" : "Start voice"}
                    >
                      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="shrink-0 rounded-lg bg-primary p-2 text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 text-center text-[10px] text-muted-foreground">
                  AI may make mistakes. Confirm critical advice with a veterinarian.
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  return createPortal(ui, document.body);
}
