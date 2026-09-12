import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_ACCOUNTS, DemoAccount } from '../../src/constants/demoUsers';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('officer@nerlogisense.gov.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [demoLoadingId, setDemoLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginDemo } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter your email, phone, or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setErrorMsg('');
    setDemoLoadingId(account.id);
    try {
      await loginDemo(account.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.warn('Demo login execution error:', err);
      setErrorMsg('Demo quick login failed. Please try again.');
    } finally {
      setDemoLoadingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Quick theme toggle top corner */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.themeIconBtn,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={toggleTheme}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={isDark ? '#f59e0b' : colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Header Branding */}
          <View style={styles.brandContainer}>
            <View
              style={[
                styles.logoBadge,
                { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` },
              ]}
            >
              <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>NER LogiSense</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              Smart Logistics & Landslide Risk Mobile Command
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.formHeader, { color: colors.text }]}>{t('enter_credentials', 'Officer Login')}</Text>

            {errorMsg ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: `${colors.sosRed}20`, borderColor: `${colors.sosRed}40` },
                ]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.sosRed} />
                <Text style={[styles.errorText, { color: colors.sosRed }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Identifier Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t('phone_or_email', 'Mobile Number or Email')}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="e.g. officer@nerlogisense.gov.in"
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('password', 'Password')}</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitText}>{t('login', 'Sign In')}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Demo Quick Logins */}
            <View style={[styles.demoSection, { borderTopColor: colors.cardBorder }]}>
              <Text style={[styles.demoTitle, { color: colors.textSubtle }]}>
                DEMO QUICK LOGINS
              </Text>
              <Text style={[styles.demoSubtitle, { color: colors.textSubtle }]}>
                Development / SIH demonstration only — signs in instantly with no password.
              </Text>
              <View style={styles.demoButtonsRow}>
                {DEMO_ACCOUNTS.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.demoChip,
                      { backgroundColor: colors.background, borderColor: colors.cardBorder },
                    ]}
                    onPress={() => handleDemoLogin(account)}
                    disabled={demoLoadingId !== null}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`Demo login as ${account.label}`}
                    accessibilityHint="Signs in instantly as this demo role, no password required"
                  >
                    {demoLoadingId === account.id ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Text style={[styles.demoChipText, { color: colors.primary }]}>{account.label}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  themeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
  },
  eyeIcon: {
    padding: 6,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 10,
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
