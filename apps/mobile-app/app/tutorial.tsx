import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Spacing, BorderRadius } from '../src/constants/theme';

const TUTORIAL_SEEN_KEY = '@app_has_seen_tutorial';

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'shield-checkmark-outline',
    title: 'Safe Navigation',
    body: 'NER LogiSense helps you find the safest route to your destination, factoring in live landslide and flood risk across the road network.',
  },
  {
    icon: 'warning-outline',
    title: 'Road Alerts',
    body: 'Get real-time alerts for landslides, floods, road blockages and other hazards, with automatic rerouting when a road becomes unsafe.',
  },
  {
    icon: 'accessibility-outline',
    title: 'Accessibility',
    body: 'Prefer wheelchair-friendly routes, avoid stairs and steep roads, and turn on large text or high contrast — all from Accessibility settings.',
  },
  {
    icon: 'mic-outline',
    title: 'Voice Assistance',
    body: 'Use voice search and voice-guided navigation to get where you need to go hands-free.',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save tutorial-seen flag:', e);
    }
    router.replace('/');
  };

  const slide = SLIDES[index];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={finish} accessible accessibilityRole="button" accessibilityLabel="Skip tutorial">
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slideContainer}>
        <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
          <Ionicons name={slide.icon} size={56} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{slide.body}</Text>
      </View>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === index ? colors.primary : colors.cardBorder },
              i === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={() => (isLast ? finish() : setIndex(index + 1))}
          accessible
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next'}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: Math.min(width - 64, 420),
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  nextBtn: {
    height: 52,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
