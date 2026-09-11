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
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { getApiErrorMessage } from '../../src/api/client';

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { user } = useAuth();
  const { colors } = useTheme();
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.fullName || 'Officer'}`}
        badgeText="LIVE RADAR"
      />
      <OfflineQueueBanner />

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {errorMsg ? (
            <View style={[styles.errorCard, { backgroundColor: `${colors.sosRed}20`, borderColor: `${colors.sosRed}40` }]}>
              <Ionicons name="cloud-offline" size={20} color={colors.sosRed} />
              <Text style={[styles.errorText, { color: colors.sosRed }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Regional Risk Hero Banner */}
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={[styles.heroLabel, { color: colors.textSubtle }]}>NER REGIONAL HIGHEST LANDSLIDE RISK</Text>
              <RiskBadge category={overallCategory} size="md" />
            </View>

            <View style={styles.heroScoreRow}>
              <Text style={[styles.heroScore, { color: colors.text }]}>{overallScore.toFixed(1)}</Text>
              <Text style={[styles.heroMax, { color: colors.textMuted }]}>/ 100</Text>
            </View>

            <Text style={[styles.heroLocation, { color: colors.textMuted }]}>
              Highest Threat Node: {maxRiskNode?.node_name || 'Monitoring Active'} ({maxRiskNode?.district || 'Shillong Corridor'})
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/map')}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Open Live Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.sosRed }]}
                onPress={() => router.push('/(tabs)/sos')}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle-outline" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>SOS Emergency</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Summary Metrics Grid */}
          <View style={styles.grid}>
            <StatCard
              title="Active Nodes"
              value={data?.total_nodes ?? 12}
              subtitle="IoT Sensors Online"
              icon="radio-outline"
              iconColor={colors.info}
              onPress={() => router.push('/(tabs)/map')}
            />

            <StatCard
              title="Critical Risks"
              value={(data?.nodes_by_category?.HIGH ?? 0) + (data?.nodes_by_category?.SEVERE ?? 0)}
              subtitle="Requires Attention"
              icon="warning-outline"
              iconColor={colors.warning}
              onPress={() => router.push('/(tabs)/risk')}
            />

            <StatCard
              title="Active Vehicles"
              value={data?.vehicles_total ?? 8}
              subtitle="On Field Routes"
              icon="bus-outline"
              iconColor={colors.primary}
              onPress={() => router.push('/(tabs)/vehicles')}
            />

            <StatCard
              title="Pending SOS"
              value={data?.open_sos ?? 1}
              subtitle="Citizen Emergencies"
              icon="camera-outline"
              iconColor={colors.riskHigh}
              onPress={() => router.push('/(tabs)/incidents')}
            />
          </View>

          {/* Top District Status List */}
          <Card title="District Risk Status" icon="business-outline">
            {data?.district_status && data.district_status.length > 0 ? (
              data.district_status.map((district, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.districtRow, { borderBottomColor: colors.cardBorder }]}
                  onPress={() => router.push('/(tabs)/risk')}
                >
                  <View style={styles.districtInfo}>
                    <Text style={[styles.districtName, { color: colors.text }]}>{district.node_name}</Text>
                    <Text style={[styles.districtSub, { color: colors.textMuted }]}>
                      {district.district}, {district.state}
                    </Text>
                  </View>
                  <RiskBadge category={district.category} score={district.risk_score} size="sm" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>No district status available.</Text>
            )}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  heroCard: {},
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
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
    letterSpacing: -1,
  },
  heroMax: {
    fontSize: 18,
    marginLeft: 6,
    fontWeight: '600',
  },
  heroLocation: {
    fontSize: 13,
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
  },
  districtInfo: {
    flex: 1,
  },
  districtName: {
    fontSize: 14,
    fontWeight: '700',
  },
  districtSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
