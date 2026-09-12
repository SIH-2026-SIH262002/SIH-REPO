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
import { LoadingSkeleton } from '../../src/components/LoadingSkeleton';
import { vehiclesApi } from '../../src/api/vehicles';
import { Vehicle } from '../../src/types';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const fetchVehicles = async () => {
    try {
      setErrorMsg('');
      const data = await vehiclesApi.getVehicles();
      setVehicles(data);
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ROUTE':
        return colors.success;
      case 'IDLE':
        return colors.warning;
      case 'EMERGENCY':
        return colors.sosRed;
      default:
        return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title={t('fleet_tracking', 'Fleet & Transport Tracking')}
        subtitle="Real-time Vehicle Status & GPS Monitoring"
        rightActionIcon="refresh-outline"
        onRightAction={fetchVehicles}
      />

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
        ) : vehicles.length === 0 ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
            No vehicles currently registered.
          </Text>
        ) : (
          vehicles.map((v) => {
            const statusColor = getStatusColor(v.status);
            return (
              <View
                key={v.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.leftHeader}>
                    <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
                      <Ionicons name="bus" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.vehicleId, { color: colors.text }]}>{v.id}</Text>
                      <Text style={[styles.driverName, { color: colors.textMuted }]}>{v.driver_name}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}40` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{v.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                {/* Cargo & Destination Banner */}
                {v.cargo_type ? (
                  <View style={[styles.cargoBanner, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                    <Ionicons name="cube-outline" size={14} color={colors.primary} />
                    <Text style={[styles.cargoText, { color: colors.textMuted }]} numberOfLines={1}>
                      Cargo: <Text style={{ color: colors.text, fontWeight: '700' }}>{v.cargo_type}</Text>
                    </Text>
                  </View>
                ) : null}

                {/* Details Grid */}
                <View style={[styles.infoGrid, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                  <View style={[styles.infoCol, { flex: 1.5 }]}>
                    <Text style={[styles.infoLabel, { color: colors.textSubtle }]}>ROUTE</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>{v.current_route || 'Unassigned'}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: colors.textSubtle }]}>SPEED</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{v.speed_kmh || 0} km/h</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={[styles.infoLabel, { color: colors.textSubtle }]}>CONTACT</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{v.phone || 'N/A'}</Text>
                  </View>
                </View>

                {/* View on Map Button */}
                <TouchableOpacity
                  style={[styles.mapBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)/map')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate-outline" size={16} color="#fff" />
                  <Text style={styles.mapBtnText}>Locate on Radar Map</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleId: {
    fontSize: 16,
    fontWeight: '800',
  },
  driverName: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cargoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  cargoText: {
    fontSize: 11,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  mapBtn: {
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
