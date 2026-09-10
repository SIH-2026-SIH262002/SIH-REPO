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
import { useRouter } from 'expo-router';
import { dashboardApi } from '../../src/api/dashboard';
import { DashboardSummary } from '../../src/types';
import { Header } from '../../src/components/Header';
import { StatCard } from '../../src/components/StatCard';
import { Card } from '../../src/components/Card';
import { RiskBadge } from '../../src/components/RiskBadge';
import { LoadingSkeleton } from '../../src/components/LoadingSkeleton';
import { OfflineQueueBanner } from '../../src/components/OfflineQueueBanner';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getApiErrorMessage } from '../../src/api/client';

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      setErrorMsg('');
      const res = await dashboardApi.getSummary();
      setData(res);
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  // Compute overall risk status from district status list
  const maxRiskNode = data?.district_status?.[0];
  const overallCategory = maxRiskNode?.category || 'LOW';
  const overallScore = maxRiskNode?.risk_score || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="NER LogiSense"
        subtitle={`Welcome, ${user?.fullName || 'Field Officer'}`}
        badgeText={user?.role || 'OFFICER'}
        rightActionIcon="refresh-outline"
        onRightAction={fetchDashboardData}
      />

      <OfflineQueueBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {errorMsg ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.sosRed} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {loading && !data ? (
          <LoadingSkeleton rows={4} />
        ) : (
          <>
            {/* Overall Risk Hero Banner */}
            <Card style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroLabel}>CURRENT HIGHEST REGIONAL RISK</Text>
                <RiskBadge category={overallCategory} size="lg" />
              </View>

              <View style={styles.heroScoreRow}>
                <Text style={styles.heroScore}>{overallScore.toFixed(0)}</Text>
                <Text style={styles.heroMax}>/ 100</Text>
              </View>

              <Text style={styles.heroLocation}>
                Highest Risk Zone: {maxRiskNode?.node_name || 'N/A'} ({maxRiskNode?.district || 'NER'})
              </Text>

              {/* Quick Actions Bar */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => router.push('/(tabs)/map')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Live Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.cardBorder }]}
                  onPress={() => router.push('/(tabs)/incidents')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.sosRed }]}
                  onPress={() => router.push('/(tabs)/sos')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="warning" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>SOS</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Metrics Grid */}
            <View style={styles.grid}>
              <StatCard
                title="Active Alerts"
                value={data?.active_alerts || 0}
                subtitle={`${data?.total_alerts_logged || 0} logged total`}
                icon="notifications"
                iconColor={Colors.warning}
                onPress={() => router.push('/(tabs)/alerts')}
              />

              <StatCard
                title="Sensor Nodes"
                value={data?.total_nodes || 0}
                subtitle="Online monitoring"
                icon="radio"
                iconColor={Colors.success}
                onPress={() => router.push('/(tabs)/map')}
              />

              <StatCard
                title="Active Vehicles"
                value={data?.vehicles_total || 0}
                subtitle="Fleet in transit"
                icon="bus"
                iconColor={Colors.primary}
                onPress={() => router.push('/(tabs)/vehicles')}
              />

              <StatCard
                title="Flagged Corridors"
                value={data?.flagged_corridors || 0}
                subtitle={`${data?.blocked_corridors || 0} blocked`}
                icon="git-branch"
                iconColor={Colors.riskHigh}
                onPress={() => router.push('/(tabs)/risk')}
              />
            </View>

            {/* Recent District Status List */}
            <Card title="District Risk Status Summary" icon="location">
              {data?.district_status?.slice(0, 5).map((dist, idx) => (
                <View key={idx} style={styles.districtRow}>
                  <View style={styles.districtInfo}>
                    <Text style={styles.districtName}>{dist.district}</Text>
                    <Text style={styles.districtSub}>Node: {dist.node_name}</Text>
                  </View>
                  <RiskBadge category={dist.category} score={dist.risk_score} size="sm" />
                </View>
              ))}
            </Card>
          </>
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
  scrollContent: {
    padding: Spacing.md,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.sosRed}20`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: `${Colors.sosRed}40`,
  },
  errorText: {
    color: Colors.sosRed,
    fontSize: 13,
    flex: 1,
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSubtle,
    letterSpacing: 1,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.sm,
  },
  heroScore: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  heroMax: {
    fontSize: 18,
    color: Colors.textMuted,
    marginLeft: 6,
    fontWeight: '600',
  },
  heroLocation: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  districtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  districtInfo: {
    flex: 1,
  },
  districtName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  districtSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
