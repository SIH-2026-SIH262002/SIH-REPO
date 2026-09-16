import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { RiskColors, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { SensorNode, Vehicle, IncidentReport, RiskCategory } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { RiskBadge } from './RiskBadge';

// Try importing react-native-maps safely
let MapView: any = null;
let Marker: any = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker;
} catch (e) {
  // react-native-maps fallback mode
}

interface InteractiveMapProps {
  sensors?: SensorNode[];
  vehicles?: Vehicle[];
  incidents?: IncidentReport[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onSelectNode?: (node: SensorNode) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  sensors = [],
  vehicles = [],
  incidents = [],
  initialRegion = {
    latitude: 25.5788,
    longitude: 91.8933,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  },
  onSelectNode,
  onSelectVehicle,
}) => {
  const { colors } = useTheme();
  const [selectedItem, setSelectedItem] = useState<{
    type: 'sensor' | 'vehicle' | 'incident';
    data: any;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'VEHICLES' | 'INCIDENTS'>('ALL');

  const filteredSensors = sensors.filter((s) => {
    if (activeFilter === 'CRITICAL') return s.category === 'HIGH' || s.category === 'SEVERE';
    if (activeFilter === 'VEHICLES' || activeFilter === 'INCIDENTS') return false;
    return true;
  });

  const filteredVehicles = vehicles.filter(() => {
    if (activeFilter === 'CRITICAL' || activeFilter === 'INCIDENTS') return false;
    return true;
  });

  const filteredIncidents = incidents.filter(() => {
    if (activeFilter === 'VEHICLES') return false;
    return true;
  });

  const handleMarkerClick = (type: 'sensor' | 'vehicle' | 'incident', data: any) => {
    setSelectedItem({ type, data });
    if (type === 'sensor' && onSelectNode) onSelectNode(data);
    if (type === 'vehicle' && onSelectVehicle) onSelectVehicle(data);
  };

  const renderFilterBar = () => (
    <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
      {(['ALL', 'CRITICAL', 'VEHICLES', 'INCIDENTS'] as const).map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterChip,
            { backgroundColor: colors.background, borderColor: colors.cardBorder },
            activeFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setActiveFilter(filter)}
        >
          <Text
            style={[
              styles.filterText,
              { color: colors.textMuted },
              activeFilter === filter && styles.filterTextActive,
            ]}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDetailCard = (item: { type: string; data: any }, onClose: () => void) => {
    const d = item.data;
    return (
      <View
        style={[
          styles.detailDrawer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text style={[styles.drawerTitle, { color: colors.text }]}>
            {item.type === 'sensor'
              ? `Node: ${d.name}`
              : item.type === 'vehicle'
              ? `Vehicle: ${d.id}`
              : `Incident: ${d.incident_type}`}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {item.type === 'sensor' && (
          <View style={styles.drawerContent}>
            <RiskBadge category={d.category} score={d.risk_score} size="md" />
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              District: {d.district}, {d.state}
            </Text>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              Soil Moisture: {d.soil_moisture_pct}% | Vibration: {d.vibration_intensity}
            </Text>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              24h Rainfall: {d.rainfall_mm_last_24h} mm | Temp: {d.temperature_c}°C
            </Text>
          </View>
        )}

        {item.type === 'vehicle' && (
          <View style={styles.drawerContent}>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              Driver: {d.driver_name} ({d.phone})
            </Text>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              Status: {d.status} | Route: {d.current_route || 'N/A'}
            </Text>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              GPS: {d.lat?.toFixed(4)}, {d.lon?.toFixed(4)}
            </Text>
          </View>
        )}

        {item.type === 'incident' && (
          <View style={styles.drawerContent}>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              Reporter: {d.reporter_name} ({d.phone || 'Anonymous'})
            </Text>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              Description: {d.description}
            </Text>
            <Text style={[styles.drawerText, { color: colors.textMuted }]}>
              GPS: {d.lat?.toFixed(4)}, {d.lon?.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render native MapView if available on native device
  if (MapView && Marker && Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MapView style={styles.map} initialRegion={initialRegion}>
          {filteredSensors.map((sensor) => {
            const color = RiskColors[sensor.category as keyof typeof RiskColors] || colors.riskLow;
            return (
              <Marker
                key={`sensor-${sensor.node_key || sensor.sensor_node_id || sensor.name}`}
                coordinate={{ latitude: sensor.lat, longitude: sensor.lon }}
                title={sensor.name}
                description={`Risk: ${sensor.category} (${sensor.risk_score})`}
                pinColor={color}
                onPress={() => handleMarkerClick('sensor', sensor)}
              />
            );
          })}

          {filteredVehicles.map((v) => (
            <Marker
              key={`vehicle-${v.id}`}
              coordinate={{ latitude: v.lat, longitude: v.lon }}
              title={`Vehicle ${v.id} (${v.driver_name})`}
              description={`Status: ${v.status}`}
              pinColor={colors.primary}
              onPress={() => handleMarkerClick('vehicle', v)}
            />
          ))}

          {filteredIncidents.map((inc, idx) => (
            <Marker
              key={`incident-${inc.id || idx}`}
              coordinate={{ latitude: inc.lat, longitude: inc.lon }}
              title={`Incident: ${inc.incident_type}`}
              description={inc.description}
              pinColor={colors.sosRed}
              onPress={() => handleMarkerClick('incident', inc)}
            />
          ))}
        </MapView>

        {/* Filter overlay */}
        {renderFilterBar()}

        {/* Selected Item Drawer */}
        {selectedItem && renderDetailCard(selectedItem, () => setSelectedItem(null))}
      </View>
    );
  }

  // Graceful fallback for Web/Emulator interactive coordinate grid radar
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.radarHeader, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.radarStatus}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.radarTitle, { color: colors.text }]}>NER LOGISTICS REAL-TIME RADAR MAP</Text>
        </View>
        <Text style={[styles.radarCoords, { color: colors.textMuted }]}>CENTER: 25.5788° N, 91.8933° E</Text>
      </View>

      {renderFilterBar()}

      <ScrollView style={styles.radarList} contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={[styles.sectionHeader, { color: colors.textSubtle }]}>
          SENSOR NODES ({filteredSensors.length})
        </Text>
        {filteredSensors.map((sensor) => (
          <TouchableOpacity
            key={`sensor-${sensor.node_key || sensor.sensor_node_id || sensor.name}`}
            style={[styles.nodeItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => handleMarkerClick('sensor', sensor)}
            activeOpacity={0.7}
          >
            <View style={styles.nodeLeft}>
              <View style={[styles.nodeIcon, { backgroundColor: `${RiskColors[sensor.category as RiskCategory]}20` }]}>
                <Ionicons name="radio" size={18} color={RiskColors[sensor.category as RiskCategory]} />
              </View>
              <View>
                <Text style={[styles.nodeName, { color: colors.text }]}>{sensor.name}</Text>
                <Text style={[styles.nodeLocation, { color: colors.textMuted }]}>
                  {sensor.district}, {sensor.state} • {sensor.lat.toFixed(3)}°, {sensor.lon.toFixed(3)}°
                </Text>
              </View>
            </View>
            <RiskBadge category={sensor.category} score={sensor.risk_score} size="sm" />
          </TouchableOpacity>
        ))}

        {filteredVehicles.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: colors.textSubtle, marginTop: Spacing.md }]}>
              ACTIVE VEHICLES ({filteredVehicles.length})
            </Text>
            {filteredVehicles.map((v) => (
              <TouchableOpacity
                key={`vehicle-${v.id}`}
                style={[styles.nodeItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => handleMarkerClick('vehicle', v)}
                activeOpacity={0.7}
              >
                <View style={styles.nodeLeft}>
                  <View style={[styles.nodeIcon, { backgroundColor: `${colors.primary}20` }]}>
                    <Ionicons name="bus" size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.nodeName, { color: colors.text }]}>
                      {v.id} - {v.driver_name}
                    </Text>
                    <Text style={[styles.nodeLocation, { color: colors.textMuted }]}>
                      {v.status} • {v.lat.toFixed(3)}°, {v.lon.toFixed(3)}°
                    </Text>
                  </View>
                </View>
                <Text style={[styles.vehicleSpeed, { color: colors.primary }]}>{v.speed_kmh || 0} km/h</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {filteredIncidents.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: colors.textSubtle, marginTop: Spacing.md }]}>
              RECENT INCIDENTS ({filteredIncidents.length})
            </Text>
            {filteredIncidents.map((inc, idx) => (
              <TouchableOpacity
                key={`incident-${inc.id || idx}`}
                style={[styles.nodeItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => handleMarkerClick('incident', inc)}
                activeOpacity={0.7}
              >
                <View style={styles.nodeLeft}>
                  <View style={[styles.nodeIcon, { backgroundColor: `${colors.sosRed}20` }]}>
                    <Ionicons name="warning" size={18} color={colors.sosRed} />
                  </View>
                  <View>
                    <Text style={[styles.nodeName, { color: colors.text }]}>
                      {inc.incident_type.toUpperCase()}
                    </Text>
                    <Text style={[styles.nodeLocation, { color: colors.textMuted }]}>
                      {inc.description || 'Reported incident'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {selectedItem && renderDetailCard(selectedItem, () => setSelectedItem(null))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  radarHeader: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  radarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radarTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  radarCoords: {
    fontSize: 11,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#fff',
  },
  radarList: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
  },
  nodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  nodeIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  nodeLocation: {
    fontSize: 11,
    marginTop: 2,
  },
  vehicleSpeed: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  drawerContent: {
    gap: 6,
    marginTop: 4,
  },
  drawerText: {
    fontSize: 13,
  },
});
