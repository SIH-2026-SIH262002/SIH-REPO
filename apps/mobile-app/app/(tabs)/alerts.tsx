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
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Active Alerts"
        subtitle="Real-time Hazards & Early Warnings"
        rightActionIcon="refresh-outline"
        onRightAction={fetchAlerts}
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, !activeOnly && styles.filterTabActive]}
          onPress={() => setActiveOnly(false)}
        >
          <Text style={[styles.filterTabText, !activeOnly && styles.filterTextActive]}>
            All Alerts ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeOnly && styles.filterTabActive]}
          onPress={() => setActiveOnly(true)}
        >
          <Text style={[styles.filterTabText, activeOnly && styles.filterTextActive]}>
            Active Only
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.sosRed} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {loading && !alerts.length ? (
          <LoadingSkeleton rows={4} />
        ) : alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
            <Text style={styles.emptyTitle}>No Active Alerts</Text>
            <Text style={styles.emptySub}>All monitored corridors are clear</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                  <Text style={styles.typeText}>{alert.type.replace(/_/g, ' ')}</Text>
                </View>
                <RiskBadge category={alert.severity} size="sm" />
              </View>

              <Text style={styles.description}>{alert.description}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.footerText}>{alert.location || 'NER Corridor'}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.footerText}>
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
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
    backgroundColor: Colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
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
    backgroundColor: `${Colors.sosRed}20`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  errorText: {
    color: Colors.sosRed,
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
    color: Colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    color: Colors.text,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.sm,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textSubtle,
  },
});
