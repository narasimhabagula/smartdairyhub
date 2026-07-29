import type { JerryLangCode, JerryLanguage } from "@/types/jerry";

/** Languages Jerry speaks. Switching is instant — no page reload. */
export const JERRY_LANGUAGES: JerryLanguage[] = [
  { code: "en", label: "English", voice: "en-IN" },
  { code: "te", label: "తెలుగు", voice: "te-IN" },
  { code: "hi", label: "हिन्दी", voice: "hi-IN" },
  { code: "ta", label: "தமிழ்", voice: "ta-IN" },
  { code: "kn", label: "ಕನ್ನಡ", voice: "kn-IN" },
  { code: "ml", label: "മലയാളം", voice: "ml-IN" },
];

export function voiceTagFor(code: JerryLangCode): string {
  return JERRY_LANGUAGES.find((l) => l.code === code)?.voice ?? "en-IN";
}

export function languageName(code: JerryLangCode): string {
  return JERRY_LANGUAGES.find((l) => l.code === code)?.label ?? "English";
}

type Dict = Record<string, string>;

const UI: Record<JerryLangCode, Dict> = {
  en: {
    title: "Jerry",
    subtitle: "Smart Dairy Assistant",
    greeting:
      "Hi 👋 I'm **Jerry**, your Smart Dairy Assistant. Ask me about milk rates, FAT & SNF, vets, schemes, feed, or the marketplace — in your own language.",
    placeholder: "Ask Jerry anything about dairy…",
    send: "Send",
    listening: "Listening…",
    thinking: "Jerry is thinking…",
    clear: "Clear chat",
    speakOn: "Voice replies on",
    speakOff: "Voice replies off",
    replay: "Replay last answer",
    stopSpeaking: "Stop speaking",
    quick: "Quick help",
    signIn: "Please sign in to chat with Jerry.",
    tooFast: "You're sending messages very quickly. Please wait a moment.",
    open: "Open Jerry assistant",
    close: "Close Jerry",
  },
  te: {
    title: "జెర్రీ",
    subtitle: "స్మార్ట్ డైరీ సహాయకుడు",
    greeting:
      "నమస్కారం 👋 నేను **జెర్రీ**, మీ స్మార్ట్ డైరీ సహాయకుడు. పాల ధరలు, FAT & SNF, పశువైద్యులు, పథకాలు, దాణా గురించి మీ భాషలో అడగండి.",
    placeholder: "జెర్రీని అడగండి…",
    send: "పంపండి",
    listening: "వినుతున్నాను…",
    thinking: "జెర్రీ ఆలోచిస్తున్నాడు…",
    clear: "చాట్ తొలగించండి",
    speakOn: "వాయిస్ ఆన్",
    speakOff: "వాయిస్ ఆఫ్",
    replay: "మళ్లీ వినండి",
    stopSpeaking: "ఆపండి",
    quick: "త్వరిత సహాయం",
    signIn: "జెర్రీతో చాట్ చేయడానికి సైన్ ఇన్ చేయండి.",
    tooFast: "కొంచెం ఆగి ప్రయత్నించండి.",
    open: "జెర్రీని తెరవండి",
    close: "మూసివేయండి",
  },
  hi: {
    title: "जेरी",
    subtitle: "स्मार्ट डेयरी सहायक",
    greeting:
      "नमस्ते 👋 मैं **जेरी** हूँ, आपका स्मार्ट डेयरी सहायक। दूध के रेट, FAT & SNF, पशु चिकित्सक, योजनाएँ या चारा — अपनी भाषा में पूछें।",
    placeholder: "जेरी से कुछ भी पूछें…",
    send: "भेजें",
    listening: "सुन रहा हूँ…",
    thinking: "जेरी सोच रहा है…",
    clear: "चैट साफ़ करें",
    speakOn: "आवाज़ चालू",
    speakOff: "आवाज़ बंद",
    replay: "दोबारा सुनें",
    stopSpeaking: "रोकें",
    quick: "तुरंत मदद",
    signIn: "जेरी से बात करने के लिए साइन इन करें।",
    tooFast: "कृपया थोड़ा रुककर भेजें।",
    open: "जेरी खोलें",
    close: "बंद करें",
  },
  ta: {
    title: "ஜெர்ரி",
    subtitle: "ஸ்மார்ட் டெய்ரி உதவியாளர்",
    greeting:
      "வணக்கம் 👋 நான் **ஜெர்ரி**, உங்கள் ஸ்மார்ட் டெய்ரி உதவியாளர். பால் விலை, FAT & SNF, கால்நடை மருத்துவர், திட்டங்கள் பற்றி கேளுங்கள்.",
    placeholder: "ஜெர்ரியிடம் கேளுங்கள்…",
    send: "அனுப்பு",
    listening: "கேட்கிறேன்…",
    thinking: "ஜெர்ரி சிந்திக்கிறார்…",
    clear: "அரட்டையை அழி",
    speakOn: "குரல் இயக்கம்",
    speakOff: "குரல் நிறுத்தம்",
    replay: "மீண்டும் கேட்க",
    stopSpeaking: "நிறுத்து",
    quick: "விரைவு உதவி",
    signIn: "ஜெர்ரியுடன் பேச உள்நுழையவும்.",
    tooFast: "சற்று பொறுத்து அனுப்புங்கள்.",
    open: "ஜெர்ரியைத் திற",
    close: "மூடு",
  },
  kn: {
    title: "ಜೆರ್ರಿ",
    subtitle: "ಸ್ಮಾರ್ಟ್ ಡೇರಿ ಸಹಾಯಕ",
    greeting:
      "ನಮಸ್ಕಾರ 👋 ನಾನು **ಜೆರ್ರಿ**, ನಿಮ್ಮ ಸ್ಮಾರ್ಟ್ ಡೇರಿ ಸಹಾಯಕ. ಹಾಲಿನ ದರ, FAT & SNF, ಪಶುವೈದ್ಯರು, ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
    placeholder: "ಜೆರ್ರಿಯನ್ನು ಕೇಳಿ…",
    send: "ಕಳುಹಿಸಿ",
    listening: "ಕೇಳುತ್ತಿದ್ದೇನೆ…",
    thinking: "ಜೆರ್ರಿ ಯೋಚಿಸುತ್ತಿದ್ದಾನೆ…",
    clear: "ಚಾಟ್ ಅಳಿಸಿ",
    speakOn: "ಧ್ವನಿ ಆನ್",
    speakOff: "ಧ್ವನಿ ಆಫ್",
    replay: "ಮತ್ತೆ ಕೇಳಿ",
    stopSpeaking: "ನಿಲ್ಲಿಸಿ",
    quick: "ತ್ವರಿತ ಸಹಾಯ",
    signIn: "ಜೆರ್ರಿಯೊಂದಿಗೆ ಚಾಟ್ ಮಾಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    tooFast: "ಸ್ವಲ್ಪ ನಿಧಾನವಾಗಿ ಕಳುಹಿಸಿ.",
    open: "ಜೆರ್ರಿ ತೆರೆಯಿರಿ",
    close: "ಮುಚ್ಚಿ",
  },
  ml: {
    title: "ജെറി",
    subtitle: "സ്മാർട്ട് ഡയറി അസിസ്റ്റന്റ്",
    greeting:
      "നമസ്കാരം 👋 ഞാൻ **ജെറി**, നിങ്ങളുടെ സ്മാർട്ട് ഡയറി അസിസ്റ്റന്റ്. പാൽ വില, FAT & SNF, വെറ്ററിനറി ഡോക്ടർ, പദ്ധതികൾ എന്നിവ ചോദിക്കാം.",
    placeholder: "ജെറിയോട് ചോദിക്കൂ…",
    send: "അയയ്ക്കുക",
    listening: "കേൾക്കുന്നു…",
    thinking: "ജെറി ചിന്തിക്കുന്നു…",
    clear: "ചാറ്റ് മായ്ക്കുക",
    speakOn: "ശബ്ദം ഓൺ",
    speakOff: "ശബ്ദം ഓഫ്",
    replay: "വീണ്ടും കേൾക്കുക",
    stopSpeaking: "നിർത്തുക",
    quick: "പെട്ടെന്നുള്ള സഹായം",
    signIn: "ജെറിയോട് സംസാരിക്കാൻ സൈൻ ഇൻ ചെയ്യുക.",
    tooFast: "അൽപ്പം കാത്തിരിക്കൂ.",
    open: "ജെറി തുറക്കുക",
    close: "അടയ്ക്കുക",
  },
};

/** Instant UI translation lookup with English fallback. */
export function jt(lang: JerryLangCode, key: string): string {
  return UI[lang]?.[key] ?? UI.en[key] ?? key;
}
