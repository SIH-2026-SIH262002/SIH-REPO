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
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        return Colors.success;
      case 'IDLE':
        return Colors.warning;
      case 'EMERGENCY':
        return Colors.sosRed;
      default:
        return Colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Fleet Vehicles"
        subtitle="Real-time Logistics & Driver Telemetry"
        rightActionIcon="refresh-outline"
        onRightAction={fetchVehicles}
      />

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

        {loading && !vehicles.length ? (
          <LoadingSkeleton rows={4} />
        ) : (
          vehicles.map((v) => {
            const statusColor = getStatusColor(v.status);
            return (
              <View key={v.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.leftHeader}>
                    <View style={[styles.iconBox, { backgroundColor: `${Colors.primary}20` }]}>
                      <Ionicons name="bus" size={20} color={Colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.vehicleId}>{v.id}</Text>
                      <Text style={styles.driverName}>{v.driver_name} ({v.phone})</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}50` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{v.status}</Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Route</Text>
                    <Text style={styles.infoValue}>{v.current_route || 'Shillong - Guwahati'}</Text>
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Speed</Text>
                    <Text style={styles.infoValue}>{v.speed_kmh || 0} km/h</Text>
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>GPS Coordinates</Text>
                    <Text style={styles.infoValue}>{v.lat.toFixed(4)}°, {v.lon.toFixed(4)}°</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => router.push('/(tabs)/map')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map" size={14} color="#fff" />
                  <Text style={styles.mapBtnText}>View on Live Map</Text>
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
    backgroundColor: Colors.background,
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
  card: {
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
    color: Colors.text,
  },
  driverName: {
    fontSize: 12,
    color: Colors.textMuted,
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
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSubtle,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  mapBtn: {
    backgroundColor: Colors.primary,
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
