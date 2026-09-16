import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { InteractiveMap } from '../../src/components/InteractiveMap';
import { sensorsApi } from '../../src/api/sensors';
import { vehiclesApi } from '../../src/api/vehicles';
import { incidentsApi } from '../../src/api/incidents';
import { SensorNode, Vehicle, IncidentReport } from '../../src/types';
import { Spacing } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const { colors } = useTheme();

  const loadMapData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [sensorData, vehicleData, incidentData] = await Promise.all([
        sensorsApi.getSensors().catch(() => []),
        vehiclesApi.getVehicles().catch(() => []),
        incidentsApi.getIncidents().catch(() => []),
      ]);

      setSensors(sensorData);
      setVehicles(vehicleData);
      setIncidents(incidentData);
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title="Live Map"
        subtitle="Geospatial Risk, Vehicle Tracking & Incidents"
        rightActionIcon="refresh-outline"
        onRightAction={loadMapData}
      />

      {errorMsg ? (
        <View style={[styles.errorBanner, { backgroundColor: `${colors.sosRed}20` }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.sosRed} />
          <Text style={[styles.errorText, { color: colors.sosRed }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>
            Loading Geospatial Sensor & Fleet Data...
          </Text>
        </View>
      ) : (
        <InteractiveMap
          sensors={sensors}
          vehicles={vehicles}
          incidents={incidents}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  loaderText: {
    fontSize: 13,
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
});
