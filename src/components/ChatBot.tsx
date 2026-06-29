import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Send, X, Mic, MicOff, Minus, Sparkles, Volume2, VolumeX, Maximize2, EyeOff, RotateCcw, ImagePlus, Camera, Phone, MapPin, Share2, Download } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "react-i18next";
import { speak as ttsSpeak, cancelSpeech, primeVoices, loadVoiceSettings, saveVoiceSettings } from "@/lib/tts";
import { supabase } from "@/integrations/supabase/client";
import chatbotIcon from "@/assets/chatbot-icon.png";

type Msg = { role: "user" | "assistant"; content: string; images?: string[]; hadImages?: boolean };

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
  ttsSpeak(text, lang);
}

// Compress a File into a JPEG data URL bounded by maxDim, target ~0.8 quality.
async function compressImage(file: File, maxDim = 1280): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      try { resolve(canvas.toDataURL("image/jpeg", 0.82)); } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
  const [speakOn, setSpeakOn] = useState<boolean>(() => loadVoiceSettings().enabled);
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
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const arr = Array.from(files).slice(0, 4);
    const compressed = await Promise.all(arr.map((f) => compressImage(f)));
    setPendingImages((prev) => [...prev, ...compressed].slice(0, 4));
  };
  const removePending = (idx: number) =>
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));

  const { transcript, listening, supported, start, stop, reset } = useSpeechRecognition(voiceLang);

  useEffect(() => { if (transcript) setInput((p) => (p ? p + " " : "") + transcript); }, [transcript]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_HIST, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  useEffect(() => {
    const cur = loadVoiceSettings();
    saveVoiceSettings({ ...cur, enabled: speakOn });
    if (!speakOn) cancelSpeech();
  }, [speakOn]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open, minimized]);

  useEffect(() => {
    primeVoices();
    return () => cancelSpeech();
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

  // Listen for visibility changes from other parts of the app (e.g., AI Chat page toggle)
  useEffect(() => {
    const onVis = (e: any) => setHidden(!!e?.detail?.hidden);
    window.addEventListener(VISIBILITY_EVENT, onVis as EventListener);
    return () => window.removeEventListener(VISIBILITY_EVENT, onVis as EventListener);
  }, []);

  const longPressTimer = useRef<number | null>(null);
  const cancelLongPress = () => {
    if (longPressTimer.current) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false };
    cancelLongPress();
    longPressTimer.current = window.setTimeout(() => {
      dragRef.current = null;
      setShowMenu(true);
    }, 550);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = e.clientX - dragRef.current.dx;
    const ny = e.clientY - dragRef.current.dy;
    if (Math.abs(nx - pos.x) + Math.abs(ny - pos.y) > 4) {
      dragRef.current.moved = true;
      cancelLongPress();
    }
    setPos({
      x: Math.min(Math.max(8, nx), window.innerWidth - 72),
      y: Math.min(Math.max(8, ny), window.innerHeight - 72),
    });
  };
  const onPointerUp = () => {
    cancelLongPress();
    const moved = dragRef.current?.moved;
    dragRef.current = null;
    try { localStorage.setItem(STORAGE_POS, JSON.stringify(pos)); } catch {}
    if (!moved && !showMenu) {
      setOpen(true);
      setMinimized(false);
      setHasNew(false);
    }
  };

  const resetPosition = () => {
    const next = { x: window.innerWidth - 88, y: window.innerHeight - 110 };
    setPos(next);
    try { localStorage.setItem(STORAGE_POS, JSON.stringify(next)); } catch {}
  };

  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    const imgs = pendingImages;
    if ((!text && imgs.length === 0) || loading) return;
    setError(null);
    setInput("");
    setPendingImages([]);
    reset();
    const detected = detectLang(text || "");
    if (detected !== "en-IN") setVoiceLang(detected);

    // Default question if user only sent images
    const userText =
      text ||
      (imgs.length
        ? "Please analyse the attached animal photo(s) and provide a probable disease report."
        : "");

    const userMsg: Msg = { role: "user", content: userText, images: imgs.length ? imgs : undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    setMessages((m) => [...m, { role: "assistant", content: "", hadImages: imgs.length > 0 }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to chat with Jerry.");
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

      // Build multimodal payload: image messages use content blocks.
      const payloadMessages = next.map((m) => {
        if (m.role === "user" && m.images?.length) {
          return {
            role: "user",
            content: [
              { type: "text", text: m.content || "Analyse the attached image(s)." },
              ...m.images.map((url) => ({ type: "image_url", image_url: { url } })),
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: payloadMessages }),
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
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {}
        }
      }

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
  }, [input, loading, messages, open, minimized, reset, speakOn, pendingImages]);

  // Action helpers for veterinary report follow-ups.
  const shareReport = async (text: string) => {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Dairy Mitra — AI Report", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Report copied to clipboard.");
      }
    } catch {}
  };
  const downloadReport = (text: string, ext: "txt" | "pdf" = "txt") => {
    // Lightweight: download as .txt (works as a printable text report). True PDF
    // generation is intentionally avoided to keep the bundle small; users can
    // print to PDF from the browser.
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dairy-mitra-report.${ext === "pdf" ? "txt" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      default: return "Hi 👋 I'm Jerry, your Smart Dairy AI Assistant. Ask me about animal diseases, milk production, feed, vet guidance, schemes, loans, weather, milk rates & the marketplace. Chat by text, voice, or upload a photo of your animal.";
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
      default: return "Ask Jerry anything...";
    }
  }, [greetingLang]);

  if (hidden) return null;

  const ui = (
    <>
      {/* Long-press / context menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[10000]" onClick={() => setShowMenu(false)} />
          <div
            className="fixed z-[10001] min-w-[220px] overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
            style={{ left: Math.min(pos.x, window.innerWidth - 240), top: Math.max(8, pos.y - 200) }}
          >
            <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
              Jerry
            </div>
            <button
              onClick={() => { setShowMenu(false); setOpen(true); setMinimized(false); setHasNew(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" /> Open Chat
            </button>
            <button
              onClick={() => { setShowMenu(false); navigate("/ai-chat"); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <Maximize2 className="h-4 w-4" /> Open Full AI Chat
            </button>
            <button
              onClick={() => { setShowMenu(false); resetPosition(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" /> Reset Position
            </button>
            <button
              onClick={() => { setShowMenu(false); setConfirmHide(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              <EyeOff className="h-4 w-4" /> Hide Jerry
            </button>
          </div>
        </>
      )}

      {/* Hide confirmation */}
      {confirmHide && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-2xl">
            <h3 className="text-base font-semibold">Hide Jerry, the floating chatbot?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You can restore Jerry anytime from the menu → <strong>Ask Jerry</strong>.

            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmHide(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmHide(false); setOpen(false); setChatbotHidden(true); }}
                className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
              >
                Yes, hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        aria-label="Ask Jerry"
        title="Need help? Chat with Jerry"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ left: pos.x, top: pos.y }}
        className={`fixed z-[9998] h-16 w-16 touch-none select-none rounded-full bg-white shadow-xl ring-2 ring-primary/30 transition-transform hover:scale-105 active:scale-95 sm:h-[72px] sm:w-[72px] ${open && !minimized ? "scale-0 pointer-events-none" : "scale-100"}`}
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20" />
        <img src={chatbotIcon} alt="Jerry — Smart Dairy AI Assistant" className="h-full w-full rounded-full object-cover" draggable={false} />
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
              <div className="truncate text-sm font-bold">Jerry</div>
              <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
                Your Smart Dairy AI Assistant • 12 languages
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
                      {m.role === "user" && m.images?.length ? (
                        <div className="mb-1.5 flex flex-wrap gap-1.5">
                          {m.images.map((src, k) => (
                            <img key={k} src={src} alt="" className="h-16 w-16 rounded-md object-cover ring-1 ring-white/30" />
                          ))}
                        </div>
                      ) : null}
                      {m.role === "assistant" ? (
                        m.content ? (
                          <>
                            <div className="prose prose-sm dark:prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_li]:my-0.5">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                            {m.hadImages && !loading && (
                              <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-border/60 pt-2">
                                <button onClick={() => navigate("/vet-contacts")} className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/15">
                                  <MapPin className="h-3.5 w-3.5" /> Find Vets
                                </button>
                                <a href="tel:1962" className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/15">
                                  <Phone className="h-3.5 w-3.5" /> Call Vet (1962)
                                </a>
                                <button onClick={() => shareReport(m.content)} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-muted">
                                  <Share2 className="h-3.5 w-3.5" /> Share
                                </button>
                                <button onClick={() => downloadReport(m.content)} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium hover:bg-muted">
                                  <Download className="h-3.5 w-3.5" /> Save Report
                                </button>
                              </div>
                            )}
                          </>
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
                {pendingImages.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {pendingImages.map((src, k) => (
                      <div key={k} className="relative">
                        <img src={src} alt="" className="h-14 w-14 rounded-md object-cover ring-1 ring-border" />
                        <button
                          type="button"
                          onClick={() => removePending(k)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-1.5 rounded-xl border border-border bg-card px-2 py-1.5 focus-within:border-primary">
                  <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted"
                    aria-label="Attach photo"
                    title="Upload photo from gallery"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted"
                    aria-label="Take photo"
                    title="Capture photo with camera"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
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
                    placeholder={pendingImages.length ? "Describe the symptoms (optional)…" : placeholder}
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
                    disabled={(!input.trim() && pendingImages.length === 0) || loading}
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
