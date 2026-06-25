import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionHook = {
  transcript: string;
  interimTranscript: string;
  listening: boolean;
  supported: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function useSpeechRecognition(lang = "en-IN"): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setListening(false);
      // Auto-restart if the user did not explicitly stop and we still have focus
      if (recognitionRef.current?.autoRestart) {
        try {
          recognition.start();
        } catch {
          // already started or destroyed
        }
      }
    };

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) final += text;
        else interim += text;
      }
      if (final) {
        setTranscript((prev) => {
          const separator = prev && !prev.endsWith(" ") ? " " : "";
          return prev + separator + final;
        });
        setInterimTranscript("");
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      switch (event.error) {
        case "not-allowed":
          setError("Microphone access denied. Please allow microphone permission.");
          break;
        case "no-speech":
          setError("No speech detected. Please try again.");
          break;
        case "network":
          setError("Network error. Please check your connection and try again.");
          break;
        case "aborted":
          setError(null);
          break;
        default:
          setError(`Voice input error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    recognitionRef.current.autoRestart = false;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Voice search is not supported in this browser.");
      return;
    }
    setError(null);
    recognitionRef.current.autoRestart = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // already started
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.autoRestart = false;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setInterimTranscript("");
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, [stop]);

  return { transcript, interimTranscript, listening, supported, error, start, stop, reset };
}
