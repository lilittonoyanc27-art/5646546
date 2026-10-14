// Web Speech API for Spanish pronunciation (es-ES / es)

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length > 0) {
      voicesLoaded = true;
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      voicesLoaded = true;
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', onVoicesChanged);

    // Timeout fallback in case voiceschanged never fires
    setTimeout(() => {
      resolve(synth.getVoices());
    }, 600);
  });
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export async function getSpanishVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice) return cachedVoice;
  if (!isSpeechSupported()) return null;

  const voices = await loadVoices();
  // Prefer es-ES, then any es
  const esVoice =
    voices.find((v) => v.lang.toLowerCase() === 'es-es') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('es')) ||
    null;

  if (esVoice) {
    cachedVoice = esVoice;
  }
  return esVoice;
}

export async function speakSpanish(text: string, rate: number = 0.9): Promise<boolean> {
  if (!isSpeechSupported()) return false;

  try {
    const synth = window.speechSynthesis;
    // Cancel any ongoing speech
    synth.cancel();

    const voice = await getSpanishVoice();
    const cleanText = text
      .replace(/[¿?¡!«»]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = rate; // Slightly slower for language learners
    utterance.pitch = 1.0;

    if (voice) {
      utterance.voice = voice;
    }

    return new Promise((resolve) => {
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      synth.speak(utterance);
    });
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    return false;
  }
}
