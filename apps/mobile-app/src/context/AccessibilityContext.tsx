import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { AccessibilityPreferences, ColorBlindMode } from '../types';

const DEFAULT_PREFS: AccessibilityPreferences = {
  largeText: false,
  highContrast: false,
  largeTouchTargets: false,
  voiceGuidance: false,
  reduceAnimation: false,
  wheelchairAccessible: false,
  avoidStairs: false,
  avoidSteepRoads: false,
  screenReaderMode: false,
  colorBlindMode: 'NONE',
  oneTouchMode: false,
  flashAlerts: false,
  hapticFeedback: true,
};

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  setPreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => Promise<void>;
  speak: (text: string, force?: boolean) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  triggerHaptic: (pattern?: number | number[]) => void;
  isSpeaking: boolean;
  fontScale: number;
  minTouchTarget: number;
}

const STORAGE_KEY = '@app_accessibility_prefs';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFS);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadSavedPrefs();
  }, []);

  const loadSavedPrefs = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.warn('Failed to load accessibility preferences:', e);
    }
  };

  const triggerHaptic = (pattern: number | number[] = 40) => {
    if (preferences.hapticFeedback) {
      Vibration.vibrate(pattern);
    }
  };

  const speak = async (text: string, force: boolean = false) => {
    if (!preferences.voiceGuidance && !force) return;
    try {
      if (Speech && typeof Speech.speak === 'function') {
        try { await Speech.stop(); } catch (_) {}
        setIsSpeaking(true);
        Speech.speak(text, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.95,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
        });
      }
    } catch (e) {
      console.warn('Speech synthesis unavailable:', e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      if (Speech && typeof Speech.stop === 'function') {
        await Speech.stop();
      }
    } catch (e) {
      console.warn('Failed to stop speech:', e);
    } finally {
      setIsSpeaking(false);
    }
  };

  const setPreference = async <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    triggerHaptic(30);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save accessibility preferences:', e);
    }

    // Voice announcement feedback when toggled
    if (key === 'voiceGuidance') {
      if (value) {
        try { Speech.stop(); } catch (_) {}
        try {
          Speech.speak('Voice guidance activated. Emergency alerts and navigation will now be read aloud.', {
            language: 'en-US',
            rate: 0.95,
          });
        } catch (_) {}
      } else {
        try { Speech.stop(); } catch (_) {}
      }
    } else if (next.voiceGuidance) {
      const labelName = String(key).replace(/([A-Z])/g, ' $1').toLowerCase();
      speak(`${labelName} turned ${value ? 'on' : 'off'}`);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        setPreference,
        speak,
        stopSpeaking,
        triggerHaptic,
        isSpeaking,
        fontScale: preferences.largeText ? 1.3 : 1,
        minTouchTarget: preferences.largeTouchTargets ? 56 : 44,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      preferences: DEFAULT_PREFS,
      setPreference: async () => {},
      speak: async () => {},
      stopSpeaking: async () => {},
      triggerHaptic: () => {},
      isSpeaking: false,
      fontScale: 1,
      minTouchTarget: 44,
    };
  }
  return context;
};
