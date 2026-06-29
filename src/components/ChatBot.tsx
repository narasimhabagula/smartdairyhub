import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Send, X, Mic, MicOff, Minus, Sparkles, Volume2, VolumeX, Maximize2, EyeOff, RotateCcw } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "react-i18next";
import chatbotIcon from "@/assets/chatbot-icon.png";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { emoji: "🥛", q: "What is today's milk rate and how is it calculated from FAT & SNF?" },
  { emoji: "🐄", q: "Common cow diseases, symptoms and prevention" },
  { emoji: "🐃", q: "How to care for a pregnant buffalo?" },
  { emoji: "🌾", q: "Best balanced feed guide for dairy cows" },
  { emoji: "💰", q: "Government dairy subsidies and loans I can apply for" },
  { emoji: "🩺", q: "How do I find a nearby veterinary doctor?" },
  { emoji: "🛒", q: "How do I buy or sell cattle on Smart Dairy Hub?" },
  { emoji: "❓", q: "What is Smart Dairy Hub and what can I do here?" },
];

const STORAGE_POS = "sdh_chatbot_pos";
const STORAGE_HIST = "sdh_chatbot_history_v1";
const STORAGE_SPEAK = "sdh_chatbot_speak";
const STORAGE_HIDDEN = "sdh_chatbot_hidden";
const VISIBILITY_EVENT = "sdh-chatbot-visibility";

export function setChatbotHidden(hidden: boolean) {
  try { localStorage.setItem(STORAGE_HIDDEN, hidden ? "1" : "0"); } catch {}
  window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT, { detail: { hidden } }));
}
export function isChatbotHidden(): boolean {
  try { return localStorage.getItem(STORAGE_HIDDEN) === "1"; } catch { return false; }
}

// Detect language from text using Unicode script ranges + Latin fallback
function detectLang(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN"; // Telugu
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN"; // Tamil
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN"; // Malayalam
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN"; // Kannada
  if (/[\u0980-\u09FF]/.test(text)) return "bn-IN"; // Bengali / Assamese
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa-IN"; // Punjabi (Gurmukhi)
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu-IN"; // Gujarati
  if (/[\u0B00-\u0B7F]/.test(text)) return "or-IN"; // Odia
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN"; // Devanagari (Hindi/Marathi)
  return "en-IN";
}

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

function speak(text: string, lang: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    // Strip markdown for cleaner speech
    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_`#>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang;
    u.rate = 0.95;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (match) u.voice = match;
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function ChatBot() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState<boolean>(() => isChatbotHidden());
  const [showMenu, setShowMenu] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
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
  const [speakOn, setSpeakOn] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_SPEAK) !== "0"; } catch { return true; }
  });
  const [voiceLang, setVoiceLang] = useState<string>(() => {
    const l = i18n.language || "en";
    if (l.startsWith("te")) return "te-IN";
    if (l.startsWith("hi")) return "hi-IN";
    if (l.startsWith("ta")) return "ta-IN";
    if (l.startsWith("ml")) return "ml-IN";
    if (l.startsWith("kn")) return "kn-IN";
    if (l.startsWith("mr")) return "mr-IN";
    if (l.startsWith("bn")) return "bn-IN";
    if (l.startsWith("pa")) return "pa-IN";
    if (l.startsWith("gu")) return "gu-IN";
    if (l.startsWith("or")) return "or-IN";
    if (l.startsWith("as")) return "as-IN";
    return "en-IN";
  });
  const lastSpokenRef = useRef<number>(-1);

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

  const { transcript, listening, supported, start, stop, reset } = useSpeechRecognition(voiceLang);

  useEffect(() => { if (transcript) setInput((p) => (p ? p + " " : "") + transcript); }, [transcript]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_HIST, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_SPEAK, speakOn ? "1" : "0"); } catch {}
    if (!speakOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [speakOn]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open, minimized]);

  // Load TTS voices (some browsers populate async)
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, []);

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
  const onPointerUp = () => {
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
    // Adapt voice language to what the user is speaking/typing
    const detected = detectLang(text);
    if (detected !== "en-IN") setVoiceLang(detected);

    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
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

      // Speak the final answer in the user's detected language
      if (speakOn && acc) {
        const replyLang = detectLang(acc) !== "en-IN" ? detectLang(acc) : detected;
        speak(acc, replyLang);
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
  }, [input, loading, messages, open, minimized, reset, speakOn]);

  const greetingLang = voiceLang.split("-")[0];
  const greeting = useMemo(() => {
    switch (greetingLang) {
      case "te": return "నమస్తే! నేను డెయిరీ మిత్ర 🐄. పాల ధరలు, పశు సంరక్షణ, వ్యాధులు, పథకాలు, మార్కెట్ గురించి అడగండి.";
      case "hi": return "नमस्ते! मैं डेयरी मित्र 🐄. दूध रेट, पशु देखभाल, बीमारियाँ, योजनाएँ, मार्केट के बारे में पूछें।";
      case "ta": return "வணக்கம்! நான் டெய்ரி மித்ரா 🐄. பால் விலை, கால்நடை பராமரிப்பு, நோய்கள், திட்டங்கள் பற்றி கேளுங்கள்.";
      case "ml": return "നമസ്കാരം! ഞാൻ ഡെയറി മിത്ര 🐄. പാൽ വില, പശു പരിചരണം, രോഗങ്ങൾ, പദ്ധതികൾ ചോദിക്കൂ.";
      case "kn": return "ನಮಸ್ಕಾರ! ನಾನು ಡೈರಿ ಮಿತ್ರ 🐄. ಹಾಲಿನ ದರ, ಪಶು ಆರೈಕೆ, ರೋಗಗಳ ಬಗ್ಗೆ ಕೇಳಿ.";
      case "mr": return "नमस्कार! मी डेअरी मित्र 🐄. दूध दर, जनावरांची काळजी, रोग, योजना विचारा.";
      case "bn": return "নমস্কার! আমি ডেইরি মিত্র 🐄. দুধের দাম, পশু যত্ন, রোগ, প্রকল্প সম্পর্কে জিজ্ঞাসা করুন।";
      case "pa": return "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਡੇਅਰੀ ਮਿਤਰ 🐄. ਦੁੱਧ ਦਾ ਰੇਟ, ਪਸ਼ੂ ਦੀ ਦੇਖਭਾਲ, ਬਿਮਾਰੀਆਂ ਬਾਰੇ ਪੁੱਛੋ।";
      case "gu": return "નમસ્તે! હું ડેરી મિત્ર 🐄. દૂધનો ભાવ, પશુ સંભાળ, રોગો વિશે પૂછો.";
      case "or": return "ନମସ୍କାର! ମୁଁ ଡେଇରୀ ମିତ୍ର 🐄. କ୍ଷୀର ଦର, ପଶୁ ଯତ୍ନ, ରୋଗ ବିଷୟରେ ପଚାରନ୍ତୁ।";
      case "as": return "নমস্কাৰ! মই ডেইৰী মিত্ৰ 🐄. গাখীৰৰ দাম, পশু যত্ন, ৰোগৰ বিষয়ে সোধক।";
      default: return "Namaste! I'm Dairy Mitra 🐄 — your AI dairy assistant. Speak or type in any Indian language about milk rates, animal care, diseases, schemes & the marketplace.";
    }
  }, [greetingLang]);

  const placeholder = useMemo(() => {
    switch (greetingLang) {
      case "te": return "ఇక్కడ టైప్ చేయండి…";
      case "hi": return "यहाँ लिखें…";
      case "ta": return "இங்கே தட்டச்சு செய்க…";
      case "ml": return "ഇവിടെ ടൈപ്പ് ചെയ്യൂ…";
      case "kn": return "ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ…";
      case "mr": return "येथे लिहा…";
      case "bn": return "এখানে লিখুন…";
      case "pa": return "ਇੱਥੇ ਲਿਖੋ…";
      case "gu": return "અહીં લખો…";
      case "or": return "ଏଠାରେ ଲେଖନ୍ତୁ…";
      case "as": return "ইয়াত লিখক…";
      default: return "Ask anything about dairy…";
    }
  }, [greetingLang]);

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
          style={{ right: 16, bottom: 16 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 px-3 py-3 text-primary-foreground">
            <img src={chatbotIcon} alt="" className="h-9 w-9 rounded-full bg-white object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">Dairy Mitra</div>
              <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
                AI Assistant • 12 languages
              </div>
            </div>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              className="max-w-[88px] truncate rounded bg-white/15 px-1.5 py-1 text-[11px] outline-none hover:bg-white/25"
              aria-label="Voice language"
              title="Voice language"
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code} className="text-foreground">{l.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSpeakOn((v) => !v)}
              className="rounded p-1.5 hover:bg-white/15"
              aria-label={speakOn ? "Mute voice" : "Unmute voice"}
              title={speakOn ? "Voice: on" : "Voice: off"}
            >
              {speakOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMinimized((v) => !v)}
              className="rounded p-1.5 hover:bg-white/15"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setOpen(false); setMinimized(false); try { window.speechSynthesis?.cancel(); } catch {} }}
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
                      {QUICK_ACTIONS.map((a, i) => (
                        <button
                          key={i}
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
                    placeholder={placeholder}
                    className="max-h-24 flex-1 resize-none bg-transparent text-sm outline-none"
                  />
                  {supported && (
                    <button
                      type="button"
                      onClick={() => (listening ? stop() : start())}
                      className={`shrink-0 rounded-lg p-2 transition ${listening ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:bg-muted"}`}
                      aria-label={listening ? "Stop voice" : "Start voice"}
                      title={listening ? "Stop listening" : `Speak in ${LANG_OPTIONS.find(l => l.code === voiceLang)?.label || "English"}`}
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
