// Voice services for Jerry: speech recognition (input) + speech synthesis (output).
// Synthesis reuses the app-wide voice settings in src/lib/tts.ts so Settings stays in control.
import { speak as ttsSpeak, cancelSpeech, pauseSpeech, resumeSpeech, isSpeechActive, primeVoices } from "@/lib/tts";
import { toSpeechText } from "@/utils/formatter";

export { cancelSpeech, pauseSpeech, resumeSpeech, isSpeechActive, primeVoices };

export function speakText(
  text: string,
  voiceTag: string,
  handlers: { onStart?: () => void; onEnd?: () => void; onError?: () => void } = {},
) {
  const clean = toSpeechText(text);
  if (!clean) return;
  ttsSpeak(clean, voiceTag, handlers);
}

export type RecognizerHandlers = {
  onResult: (finalText: string, interim: string) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

export function isRecognitionSupported(): boolean {
  return typeof window !== "undefined" &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/** Thin wrapper around the Web Speech API so components stay declarative. */
export function createRecognizer(voiceTag: string, handlers: RecognizerHandlers) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const recognition = new SR();
  recognition.lang = voiceTag;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalText = "";
  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const res = event.results[i];
      if (res.isFinal) finalText += res[0].transcript;
      else interim += res[0].transcript;
    }
    handlers.onResult(finalText.trim(), interim.trim());
  };
  recognition.onerror = (e: any) => {
    const code = e?.error ?? "unknown";
    handlers.onError?.(
      code === "not-allowed" || code === "service-not-allowed"
        ? "Microphone permission is blocked. Allow mic access in your browser settings."
        : "Voice input failed. Please try again.",
    );
  };
  recognition.onend = () => handlers.onEnd?.();

  return {
    start() {
      finalText = "";
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    },
    stop() {
      try {
        recognition.stop();
      } catch {
        /* not running */
      }
    },
    abort() {
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    },
  };
}

/** Explicit microphone permission prompt with a friendly failure path. */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}
