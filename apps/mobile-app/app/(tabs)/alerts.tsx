import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { RiskBadge } from '../../src/components/RiskBadge';
import { LoadingSkeleton } from '../../src/components/LoadingSkeleton';
import { alertsApi } from '../../src/api/alerts';
import { Alert } from '../../src/types';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { colors } = useTheme();

  const fetchAlerts = async () => {
    try {
      setErrorMsg('');
      const data = await alertsApi.getAlerts(activeOnly);
      setAlerts(data);
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeOnly]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts();
  }, [activeOnly]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title="Active Alerts"
        subtitle="Real-time Hazards & Early Warnings"
        rightActionIcon="refresh-outline"
        onRightAction={fetchAlerts}
      />

      {/* Filter Tabs */}
      <View
        style={[
          styles.filterRow,
          { backgroundColor: colors.card, borderBottomColor: colors.cardBorder },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: colors.background, borderColor: colors.cardBorder },
            !activeOnly && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setActiveOnly(false)}
        >
          <Text style={[styles.filterTabText, { color: colors.textMuted }, !activeOnly && styles.filterTextActive]}>
            All Alerts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: colors.background, borderColor: colors.cardBorder },
            activeOnly && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setActiveOnly(true)}
        >
          <Text style={[styles.filterTabText, { color: colors.textMuted }, activeOnly && styles.filterTextActive]}>
            Active Hazards
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {errorMsg ? (
          <View style={[styles.errorBox, { backgroundColor: `${colors.sosRed}20` }]}>
            <Ionicons name="alert-circle" size={18} color={colors.sosRed} />
            <Text style={[styles.errorText, { color: colors.sosRed }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Hazards Reported</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              All monitored corridors are currently safe.
            </Text>
          </View>
        ) : (
          alerts.map((item) => (
            <View
              key={item.id}
              style={[
                styles.alertCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Ionicons name="warning-outline" size={18} color={colors.warning} />
                  <Text style={[styles.typeText, { color: colors.text }]}>{item.type}</Text>
                </View>
                <RiskBadge category={item.severity} size="sm" />
              </View>

              <Text style={[styles.description, { color: colors.textMuted }]}>{item.description}</Text>

              <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
                <View style={styles.footerItem}>
                  <Ionicons name="location-outline" size={12} color={colors.textSubtle} />
                  <Text style={[styles.footerText, { color: colors.textSubtle }]}>{item.location}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textSubtle} />
                  <Text style={[styles.footerText, { color: colors.textSubtle }]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
  },
  alertCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
  },
});
