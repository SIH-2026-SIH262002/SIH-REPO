import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { InteractiveMap } from '../../src/components/InteractiveMap';
import { sensorsApi } from '../../src/api/sensors';
import { vehiclesApi } from '../../src/api/vehicles';
import { incidentsApi } from '../../src/api/incidents';
import { SensorNode, Vehicle, IncidentReport } from '../../src/types';
import { Colors, Spacing } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Live Map"
        subtitle="Geospatial Risk, Vehicle Tracking & Incidents"
        rightActionIcon="refresh-outline"
        onRightAction={loadMapData}
      />

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.sosRed} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading Geospatial Sensor & Fleet Data...</Text>
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
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  loaderText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.sosRed}20`,
    padding: 10,
    gap: 8,
  },
  errorText: {
    color: Colors.sosRed,
    fontSize: 12,
    flex: 1,
  },
});
