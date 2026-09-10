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
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
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
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="User Profile" subtitle="Officer Credentials & Backend Settings" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <View style={styles.userTitles}>
              <Text style={styles.userName}>{user?.fullName || 'Field Officer'}</Text>
              <Text style={styles.userRole}>{user?.role || 'FIELD_OFFICER'}</Text>
            </View>
          </View>
        </Card>

        {/* Credentials & Details */}
        <Card title="Account Details" icon="information-circle">
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Identifier:</Text>
            <Text style={styles.detailVal}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone Number:</Text>
            <Text style={styles.detailVal}>{user?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned District:</Text>
            <Text style={styles.detailVal}>{user?.district || 'East Khasi Hills'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Organization:</Text>
            <Text style={styles.detailVal}>{user?.organization || 'NER Logistics'}</Text>
          </View>
        </Card>

        {/* Backend Environment Configuration */}
        <Card title="API Backend Configuration" icon="hardware-chip">
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>FastAPI Endpoint:</Text>
            <Text style={[styles.detailVal, { color: Colors.primary }]}>{API_URL}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auth Mode:</Text>
            <Text style={styles.detailVal}>JWT Bearer (SecureStore)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>App Target:</Text>
            <Text style={styles.detailVal}>Android Production APK / Expo</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.sosRed} />
          <Text style={styles.logoutText}>Sign Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  userCard: {
    backgroundColor: Colors.card,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  userTitles: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.sosRed}15`,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.sosRed}40`,
    gap: 8,
    marginTop: Spacing.md,
  },
  logoutText: {
    color: Colors.sosRed,
    fontSize: 14,
    fontWeight: '700',
  },
});
