// Shared TTS helper with user-tunable voice settings and barge-in support.
// Voice preferences are stored in localStorage so Settings can configure them globally.

export type VoiceSettings = {
  enabled: boolean;
  preferredLang: string;   // BCP-47 like "te-IN"
  rate: number;            // 0.5 – 1.5
  volume: number;          // 0 – 1
};

const KEY = "sdh_voice_settings_v1";

export const DEFAULT_VOICE: VoiceSettings = {
  enabled: true,
  preferredLang: "en-IN",
  rate: 0.95,
  volume: 1,
};

export function loadVoiceSettings(): VoiceSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_VOICE };
    return { ...DEFAULT_VOICE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_VOICE };
  }
}

export function saveVoiceSettings(v: VoiceSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
}

export function cancelSpeech() {
  try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch {}
}

export function pauseSpeech() {
  try { if ("speechSynthesis" in window) window.speechSynthesis.pause(); } catch {}
}

export function resumeSpeech() {
  try { if ("speechSynthesis" in window) window.speechSynthesis.resume(); } catch {}
}

export function isSpeechPaused(): boolean {
  try { return "speechSynthesis" in window && window.speechSynthesis.paused; } catch { return false; }
}

export function isSpeechActive(): boolean {
  try { return "speechSynthesis" in window && window.speechSynthesis.speaking; } catch { return false; }
}

function pickBestVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  const base = lang.split("-")[0];
  // Prefer exact lang + Google/Microsoft natural voices first.
  const priorityNames = [/google/i, /natural/i, /microsoft/i, /neural/i];
  const exact = voices.filter((v) => v.lang === lang);
  const sameBase = voices.filter((v) => v.lang.startsWith(base));
  const pool = [...exact, ...sameBase.filter((v) => !exact.includes(v))];
  for (const re of priorityNames) {
    const m = pool.find((v) => re.test(v.name));
    if (m) return m;
  }
  return pool[0];
}

export type SpeakHandlers = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
};

export function speak(text: string, lang: string, handlers: SpeakHandlers = {}) {
  try {
    if (!("speechSynthesis" in window)) return;
    const settings = loadVoiceSettings();
    if (!settings.enabled) return;
    window.speechSynthesis.cancel();

    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_`#>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;

    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang;
    u.rate = Math.min(1.5, Math.max(0.5, settings.rate));
    u.volume = Math.min(1, Math.max(0, settings.volume));
    u.pitch = 1;
    const voice = pickBestVoice(lang);
    if (voice) u.voice = voice;
    u.onstart = () => handlers.onStart?.();
    u.onend = () => handlers.onEnd?.();
    u.onerror = () => handlers.onError?.();
    window.speechSynthesis.speak(u);
  } catch {
    handlers.onError?.();
  }
}

// Pre-warm voice list (some browsers populate async).
export function primeVoices() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
