export const voiceService = {
  speakAlert: (message: string, lang: 'EN' | 'HI' | 'AS' = 'EN') => {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (lang === 'HI') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'AS') {
      utterance.lang = 'as-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    window.speechSynthesis.speak(utterance);
  },
};
