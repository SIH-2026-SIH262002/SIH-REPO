import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme, ThemeMode } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { LanguageCode } from '../../src/constants/translations';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { AccessibilityPreferences, ColorBlindMode } from '../../src/types';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, isDemoSession } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { language, languages, languageNames, needsNativeReview, setLanguage, t } = useLanguage();
  const { preferences: a11y, setPreference, speak, isSpeaking, stopSpeaking } = useAccessibility();
  const router = useRouter();

  const accessibilityOptions: { key: keyof AccessibilityPreferences; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'largeText', label: t('large_text', 'Large Text'), hint: t('large_text_hint', 'Increase text size across the app'), icon: 'text-outline' },
    { key: 'highContrast', label: t('high_contrast', 'High Contrast'), hint: t('high_contrast_hint', 'Increase color contrast for readability'), icon: 'contrast-outline' },
    { key: 'largeTouchTargets', label: t('large_buttons', 'Large Buttons'), hint: t('large_buttons_hint', 'Increase the tappable size of buttons'), icon: 'expand-outline' },
    { key: 'voiceGuidance', label: t('voice_guidance', 'Voice Guidance'), hint: t('voice_guidance_hint', 'Read alerts and navigation aloud'), icon: 'volume-high-outline' },
    { key: 'screenReaderMode', label: 'Screen Reader Mode', hint: 'Enhanced accessibility labels and spoken element focus', icon: 'eye-outline' },
    { key: 'reduceAnimation', label: t('reduce_animation', 'Reduce Animation'), hint: t('reduce_animation_hint', 'Minimize motion and transitions'), icon: 'pulse-outline' },
    { key: 'wheelchairAccessible', label: t('wheelchair_routes', 'Wheelchair Accessible Routes'), hint: t('wheelchair_hint', 'Prefer routes usable with a wheelchair'), icon: 'accessibility-outline' },
    { key: 'avoidStairs', label: t('avoid_stairs', 'Avoid Stairs'), hint: t('avoid_stairs_hint', 'Route around staircases where possible'), icon: 'trail-sign-outline' },
    { key: 'avoidSteepRoads', label: t('avoid_steep', 'Avoid Steep Roads'), hint: t('avoid_steep_hint', 'Route around steep inclines where possible'), icon: 'trending-up-outline' },
    { key: 'flashAlerts', label: 'Audio-Visual Flash Alerts', hint: 'Screen border flash & pulse vibration on emergency alerts', icon: 'flash-outline' },
    { key: 'hapticFeedback', label: 'Haptic Vibration Feedback', hint: 'Tactile vibration response on button presses & alerts', icon: 'hardware-chip-outline' },
    { key: 'oneTouchMode', label: 'One-Touch Quick Emergency Mode', hint: 'Simplified large tap layout for glove / field operation', icon: 'hand-right-outline' },
  ];

  const colorBlindModes: { mode: ColorBlindMode; label: string }[] = [
    { mode: 'NONE', label: 'Standard' },
    { mode: 'DEUTAN', label: 'Deutan (Green)' },
    { mode: 'PROTAN', label: 'Protan (Red)' },
    { mode: 'TRITAN', label: 'Tritan (Blue)' },
    { mode: 'MONOCHROME', label: 'Monochrome' },
  ];

  const handleLogout = () => {
    RNAlert.alert(
      t('sign_out', 'Sign Out'),
      t('sign_out_confirm', 'Are you sure you want to sign out from NER LogiSense?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('sign_out', 'Sign Out'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: t('theme_light', 'Light'), icon: 'sunny-outline' },
    { mode: 'dark', label: t('theme_dark', 'Dark'), icon: 'moon-outline' },
    { mode: 'system', label: t('theme_system', 'System'), icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title={t('user_profile', 'User Profile')} subtitle={t('profile_subtitle', 'Officer Credentials & App Preferences')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.userTitles}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName || 'Field Officer'}</Text>
              <Text style={[styles.userRole, { color: colors.primary }]}>{user?.role || 'FIELD_OFFICER'}</Text>
            </View>
          </View>
        </Card>

        {/* Theme / Appearance Card */}
        <Card title={t('appearance_theme', 'Appearance & Theme')} icon="color-palette-outline">
          <Text style={[styles.themeSubtitle, { color: colors.textMuted }]}>
            {t('theme_subtitle', 'Choose your preferred UI theme mode:')}
          </Text>
          <View style={styles.themeGroup}>
            {themeOptions.map((opt) => {
              const isActive = themeMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.cardBorder,
                    },
                    isActive && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setThemeMode(opt.mode)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={isActive ? '#ffffff' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.themeBtnText,
                      { color: colors.textMuted },
                      isActive && styles.themeBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Language Card */}
        <Card title={t('language_card_title', 'Language / ভাষা')} icon="language-outline">
          <Text style={[styles.themeSubtitle, { color: colors.textMuted }]}>
            {t('language_card_subtitle', 'Choose your preferred language for alerts and SOS messages:')}
          </Text>
          <View style={styles.languageGrid}>
            {languages.map((code: LanguageCode) => {
              const isActive = language === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageChip,
                    { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                    isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setLanguage(code)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      { color: colors.textMuted },
                      isActive && styles.themeBtnTextActive,
                    ]}
                  >
                    {languageNames[code]}
                  </Text>
                  {needsNativeReview(code) && (
                    <Ionicons
                      name="alert-circle-outline"
                      size={12}
                      color={isActive ? '#ffffff' : colors.warning}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {needsNativeReview(language) && (
            <Text style={[styles.languageReviewNote, { color: colors.warning }]}>
              {t('language_review_note', '⚠ This translation is machine-drafted and pending native-speaker review.')}
            </Text>
          )}
        </Card>

        {/* Accessibility Settings Card */}
        <Card title={t('accessibility', 'Accessibility')} icon="accessibility-outline">
          {/* Voice Guidance Active Synthesizer Tester */}
          <TouchableOpacity
            style={[
              styles.voiceTestBtn,
              {
                backgroundColor: isSpeaking ? `${colors.sosRed}20` : `${colors.primary}15`,
                borderColor: isSpeaking ? colors.sosRed : `${colors.primary}40`,
              },
            ]}
            onPress={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speak('Voice guidance is active! High landslide risk alerts and navigation turns will be read aloud.', true);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSpeaking ? 'volume-mute' : 'volume-high'}
              size={20}
              color={isSpeaking ? colors.sosRed : colors.primary}
            />
            <Text
              style={[
                styles.voiceTestText,
                { color: isSpeaking ? colors.sosRed : colors.primary },
              ]}
            >
              {isSpeaking ? 'STOP VOICE GUIDANCE READOUT' : 'TEST VOICE GUIDANCE AUDIO'}
            </Text>
          </TouchableOpacity>

          {/* Accessibility Option Toggles */}
          {accessibilityOptions.map((opt, idx) => (
            <View
              key={opt.key}
              style={[
                styles.a11yRow,
                idx < accessibilityOptions.length - 1 && { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 },
              ]}
              accessible
              accessibilityRole="switch"
              accessibilityLabel={opt.label}
              accessibilityHint={opt.hint}
              accessibilityState={{ checked: Boolean(a11y[opt.key]) }}
            >
              <Ionicons name={opt.icon} size={20} color={colors.textMuted} style={{ marginRight: Spacing.sm }} />
              <View style={styles.a11yTextWrap}>
                <Text style={[styles.a11yLabel, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.a11yHint, { color: colors.textMuted }]}>{opt.hint}</Text>
              </View>
              <Switch
                value={Boolean(a11y[opt.key])}
                onValueChange={(v) => setPreference(opt.key, v)}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={a11y[opt.key] ? '#ffffff' : colors.textMuted}
              />
            </View>
          ))}

          {/* Color Blindness Filter Selector */}
          <View style={styles.colorBlindSection}>
            <Text style={[styles.colorBlindTitle, { color: colors.text }]}>Color Vision Adjustment</Text>
            <Text style={[styles.colorBlindSub, { color: colors.textMuted }]}>
              Optimizes risk badges & alert colors for color vision deficiency:
            </Text>
            <View style={styles.colorBlindGrid}>
              {colorBlindModes.map((cb) => {
                const isActive = a11y.colorBlindMode === cb.mode;
                return (
                  <TouchableOpacity
                    key={cb.mode}
                    style={[
                      styles.colorBlindChip,
                      { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                      isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setPreference('colorBlindMode', cb.mode)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.colorBlindChipText,
                        { color: colors.textMuted },
                        isActive && styles.themeBtnTextActive,
                      ]}
                    >
                      {cb.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Credentials & Details */}
        <Card title="Account Details" icon="information-circle">
          {isDemoSession && (
            <View style={[styles.demoBadge, { backgroundColor: `${colors.warning}20`, borderColor: `${colors.warning}50` }]}>
              <Ionicons name="flask-outline" size={14} color={colors.warning} />
              <Text style={[styles.demoBadgeText, { color: colors.warning }]}>
                Demo Account — not a real authenticated session
              </Text>
            </View>
          )}
          <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email Identifier:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Phone Number:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{user?.phone || 'N/A'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Assigned District:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{user?.district || 'East Khasi Hills'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Organization:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>{user?.organization || 'NER Logistics'}</Text>
          </View>
        </Card>


        {/* Sign Out Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: `${colors.sosRed}15`,
              borderColor: `${colors.sosRed}40`,
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.sosRed} />
          <Text style={[styles.logoutText, { color: colors.sosRed }]}>{t('sign_out', 'Sign Out of Account')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  userCard: {},
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  userTitles: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  themeSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  themeGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeBtnTextActive: {
    color: '#ffffff',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  languageChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  languageReviewNote: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  a11yRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  a11yTextWrap: {
    flex: 1,
  },
  a11yLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  a11yHint: {
    fontSize: 11,
    marginTop: 2,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 8,
    marginTop: Spacing.md,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  voiceTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  voiceTestText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  colorBlindSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  colorBlindTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorBlindSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  colorBlindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  colorBlindChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  colorBlindChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
