import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../src/context/OfflineContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { View, Text, StyleSheet } from 'react-native';
import { Role } from '../../src/types';

// RBAC: which tabs each role sees. Screens not listed for a role are hidden
// from the tab bar (href: null) but the backend still enforces permissions
// independently for every write/verify action, per-route.
const TAB_NAME = {
  DASHBOARD: 'index',
  MAP: 'map',
  RISK: 'risk',
  ALERTS: 'alerts',
  VEHICLES: 'vehicles',
  INCIDENTS: 'incidents',
  SOS: 'sos',
  PROFILE: 'profile',
} as const;

const ALL_TABS = Object.values(TAB_NAME);

const ROLE_TABS: Record<Role, readonly string[]> = {
  DRIVER: [
    TAB_NAME.DASHBOARD, TAB_NAME.MAP, TAB_NAME.ALERTS,
    TAB_NAME.VEHICLES, TAB_NAME.INCIDENTS, TAB_NAME.SOS, TAB_NAME.PROFILE,
  ],
  LOCAL_USER: [
    TAB_NAME.DASHBOARD, TAB_NAME.MAP, TAB_NAME.ALERTS,
    TAB_NAME.INCIDENTS, TAB_NAME.SOS, TAB_NAME.PROFILE,
  ],
  // Officer / operator / admin roles: full access, as before RBAC existed.
  FIELD_OFFICER: ALL_TABS,
  LOGISTICS_OPERATOR: ALL_TABS,
  DISTRICT_AUTHORITY: ALL_TABS,
  ADMIN: ALL_TABS,
  SUPER_ADMIN: ALL_TABS,
};

export default function TabsLayout() {
  const { pendingCount } = useOffline();
  const { colors } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  const visibleTabs = ROLE_TABS[user?.role ?? 'FIELD_OFFICER'] ?? ALL_TABS;
  const hidden = (name: string) => !visibleTabs.includes(name);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard_tab', 'Dashboard'),
          href: hidden(TAB_NAME.DASHBOARD) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('map_tab', 'Live Map'),
          href: hidden(TAB_NAME.MAP) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="risk"
        options={{
          title: t('risk_tab', 'Risk AI'),
          href: hidden(TAB_NAME.RISK) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t('alerts_tab', 'Alerts'),
          href: hidden(TAB_NAME.ALERTS) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: t('vehicles_tab', 'Vehicles'),
          href: hidden(TAB_NAME.VEHICLES) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bus-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: t('report_tab', 'Report'),
          href: hidden(TAB_NAME.INCIDENTS) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="camera-outline" size={size - 2} color={color} />
              {pendingCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: t('sos_tab', 'SOS'),
          href: hidden(TAB_NAME.SOS) ? null : undefined,
          tabBarIcon: ({ size }) => (
            <Ionicons name="alert-circle" size={size + 2} color={colors.sosRed} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistance"
        options={{
          title: 'Assistance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile_tab', 'Profile'),
          href: hidden(TAB_NAME.PROFILE) ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
