import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme, ThemeMode } from '../../src/context/ThemeContext';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();
  const router = useRouter();

  const handleLogout = () => {
    RNAlert.alert(
      'Sign Out',
      'Are you sure you want to sign out from NER LogiSense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
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
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="User Profile" subtitle="Officer Credentials & App Preferences" />

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
        <Card title="Appearance & Theme" icon="color-palette-outline">
          <Text style={[styles.themeSubtitle, { color: colors.textMuted }]}>
            Choose your preferred UI theme mode:
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

        {/* Credentials & Details */}
        <Card title="Account Details" icon="information-circle">
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

        {/* Backend Environment Configuration */}
        <Card title="API Backend Configuration" icon="hardware-chip">
          <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>FastAPI Endpoint:</Text>
            <Text style={[styles.detailVal, { color: colors.primary }]}>{API_URL}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Auth Mode:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>JWT Bearer (SecureStore)</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>App Target:</Text>
            <Text style={[styles.detailVal, { color: colors.text }]}>Android Production APK / Expo</Text>
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
          <Text style={[styles.logoutText, { color: colors.sosRed }]}>Sign Out of Account</Text>
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
});
