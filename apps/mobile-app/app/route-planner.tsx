import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../src/components/Header';
import { Card } from '../src/components/Card';
import { routesApi } from '../src/api/routes';
import { useTheme } from '../src/context/ThemeContext';
import { useLanguage } from '../src/context/LanguageContext';
import { useAccessibility } from '../src/context/AccessibilityContext';
import { getApiErrorMessage } from '../src/api/client';
import { Spacing, BorderRadius } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { RouteNode, RouteOption, RouteStatus } from '../src/types';

import { useAuth } from '../src/context/AuthContext';
import { firestoreSync } from '../src/services/firestoreSync';

const STATUS_META: Record<RouteStatus, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  SAFE: { icon: 'checkmark-circle', label: 'SAFE' },
  CAUTION: { icon: 'warning', label: 'CAUTION' },
  AVOID: { icon: 'close-circle', label: 'BLOCKED' },
};

export default function RoutePlannerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { preferences, speak } = useAccessibility();

  const [nodes, setNodes] = useState<RouteNode[]>([]);
  const [origin, setOrigin] = useState<RouteNode | null>(null);
  const [destination, setDestination] = useState<RouteNode | null>(null);
  const [pickerFor, setPickerFor] = useState<'origin' | 'destination' | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(null);

  useEffect(() => {
    routesApi.getNodes().then(setNodes).catch(() => setNodes([]));
  }, []);

  // Real-time Firestore Listener (onSnapshot) for active route
  useEffect(() => {
    if (!activeRoute?.route_id) return;

    const routeId = activeRoute.route_id;
    const unsub = firestoreSync.subscribeRouteStatus(routeId, (firestoreData) => {
      if (firestoreData && firestoreData.status) {
        setActiveRoute((prev) => {
          if (!prev) return null;
          const isBlocked = firestoreData.status === 'AVOID';
          if (prev.status !== firestoreData.status) {
            speak(`Realtime Alert: Route ${firestoreData.routeName || ''} status updated to ${firestoreData.status} by ${firestoreData.updatedByRole || 'Officer'}`);
          }
          return {
            ...prev,
            status: firestoreData.status,
            any_segment_blocked: isBlocked,
          };
        });
      }
    });

    return () => {
      unsub();
    };
  }, [activeRoute?.route_id]);

  const statusColor = (status: RouteStatus) => {
    if (status === 'SAFE') return colors.success;
    if (status === 'CAUTION') return colors.warning;
    return colors.sosRed;
  };

  const findRoutes = async () => {
    if (!origin || !destination) {
      setErrorMsg('Select both origin and destination.');
      return;
    }
    if (origin.key === destination.key) {
      setErrorMsg('Origin and destination must be different.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setRoutes([]);
    setActiveRoute(null);
    try {
      const result = await routesApi.planRoute(origin.key, destination.key, 3, {
        avoidSteepRoads: preferences.avoidSteepRoads,
      });
      setRoutes(result.routes || []);
      if (!result.routes || result.routes.length === 0) {
        setErrorMsg('No route found between these locations.');
      }
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = (route: RouteOption) => {
    setActiveRoute(route);
    // Sync initial route state to Firestore database
    firestoreSync.updateRouteStatus(
      route.route_id,
      route.route_id,
      route.status,
      'Navigation Active',
      user?.role || 'DRIVER',
      user?.userId || 'device-1'
    );
  };

  const handleToggleBlockRoute = async () => {
    if (!activeRoute) return;
    const nextStatus: RouteStatus = activeRoute.status === 'AVOID' ? 'SAFE' : 'AVOID';
    await firestoreSync.updateRouteStatus(
      activeRoute.route_id,
      activeRoute.route_id,
      nextStatus,
      nextStatus === 'AVOID' ? 'Landslide Blockage Reported by Field Officer' : 'Route Cleared',
      user?.role || 'FIELD_OFFICER',
      user?.userId || 'device-2'
    );
  };

  const reroute = () => {
    findRoutes();
  };

  if (activeRoute) {
    const meta = STATUS_META[activeRoute.status];
    const color = statusColor(activeRoute.status);
    const isOfficer = user?.role === 'FIELD_OFFICER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header
          title="Navigation Active"
          subtitle={`${origin?.name} → ${destination?.name}`}
          rightActionIcon="close-outline"
          onRightAction={() => setActiveRoute(null)}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card>
            <View style={styles.statusRow}>
              <Ionicons name={meta.icon} size={28} color={color} />
              <Text style={[styles.statusLabel, { color }]}>{meta.label} ROUTE</Text>
            </View>
            <Text style={[styles.bigStat, { color: colors.text }]}>
              ETA: {activeRoute.estimated_time_hr} hr &nbsp;•&nbsp; {activeRoute.total_distance_km} km
            </Text>

            {/* Launch Google Maps Turn-by-Turn Reroute */}
            <TouchableOpacity
              style={[styles.googleMapsNavBtn, { backgroundColor: '#4285F4' }]}
              onPress={() => {
                const destQuery = destination ? encodeURIComponent(`${destination.name}, ${destination.district || ''}`) : 'Meghalaya';
                const lat = destination?.lat || 25.5788;
                const lon = destination?.lon || 91.8933;
                const url = Platform.select({
                  ios: `maps:0,0?q=${destQuery}&ll=${destQuery}&destination=${lat},${lon}`,
                  android: `google.navigation:q=${lat},${lon}`,
                }) || `https://www.google.com/maps/dir/?api=1&destination=${destQuery}`;

                Linking.openURL(url).catch(() => {
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-circle-outline" size={18} color="#fff" />
              <Text style={styles.googleMapsNavText}>OPEN GOOGLE MAPS REROUTE NAVIGATION</Text>
            </TouchableOpacity>
          </Card>

          {/* Realtime Firestore Officer Action: Block / Clear Route sync for multi-phone testing */}
          {isOfficer && (
            <TouchableOpacity
              style={[
                styles.rerouteBtn,
                { backgroundColor: activeRoute.status === 'AVOID' ? colors.success : colors.sosRed, marginTop: 8 },
              ]}
              onPress={handleToggleBlockRoute}
            >
              <Ionicons name="wifi-outline" size={16} color="#fff" />
              <Text style={styles.rerouteBtnText}>
                {activeRoute.status === 'AVOID'
                  ? 'FIRESTORE REALTIME: UNBLOCK / CLEAR ROUTE'
                  : 'FIRESTORE REALTIME: MARK ROUTE BLOCKED (SYNC TO DRIVER)'}
              </Text>
            </TouchableOpacity>
          )}

          {activeRoute.any_segment_blocked && (
            <Card style={{ backgroundColor: `${colors.sosRed}15`, borderColor: `${colors.sosRed}40` }}>
              <View style={styles.statusRow}>
                <Ionicons name="alert-circle" size={22} color={colors.sosRed} />
                <Text style={[styles.alertTitle, { color: colors.sosRed }]}>REALTIME ROUTE ALERT</Text>
              </View>
              <Text style={[styles.alertBody, { color: colors.text }]}>
                {t('high_risk_alert')}. Current route has been marked BLOCKED via Firestore realtime listener.
              </Text>
              <TouchableOpacity
                style={[styles.rerouteBtn, { backgroundColor: colors.sosRed }]}
                onPress={reroute}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Reroute"
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.rerouteBtnText}>Reroute</Text>
              </TouchableOpacity>
            </Card>
          )}



          <Card title="Segments" icon="git-network-outline">
            {activeRoute.segments.map((seg, idx) => (
              <View
                key={idx}
                style={[styles.segmentRow, { borderBottomColor: colors.cardBorder }]}
              >
                <Ionicons
                  name={seg.blocked ? 'close-circle' : seg.flagged ? 'warning' : 'checkmark-circle'}
                  size={16}
                  color={seg.blocked ? colors.sosRed : seg.flagged ? colors.warning : colors.success}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.segmentText, { color: colors.text }]}>
                    {seg.from_name} → {seg.to_name}
                  </Text>
                  <Text style={[styles.segmentSub, { color: colors.textMuted }]}>
                    {seg.highway_ref} • {seg.distance_km} km • Risk {seg.risk_score}
                    {seg.steep ? ' • Steep' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title={t('route_planner', 'Safe Route Planner')}
        subtitle="Safe-route search across the NER road network"
        rightActionIcon="close-outline"
        onRightAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card title="Destination Search" icon="navigate-outline">
          <TouchableOpacity
            style={[styles.pickerField, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
            onPress={() => setPickerFor('origin')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Choose origin"
          >
            <Ionicons name="radio-button-on-outline" size={18} color={colors.primary} />
            <Text style={[styles.pickerText, { color: origin ? colors.text : colors.textSubtle }]}>
              {origin ? `${origin.name}, ${origin.state}` : 'Select origin'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickerField, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
            onPress={() => setPickerFor('destination')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Choose destination"
          >
            <Ionicons name="location-outline" size={18} color={colors.sosRed} />
            <Text style={[styles.pickerText, { color: destination ? colors.text : colors.textSubtle }]}>
              {destination ? `${destination.name}, ${destination.state}` : 'Select destination'}
            </Text>
          </TouchableOpacity>

          {preferences.avoidSteepRoads && (
            <Text style={[styles.prefNote, { color: colors.textMuted }]}>
              Applying your Accessibility preference: avoid steep roads.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.findBtn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
            onPress={findRoutes}
            disabled={loading}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Find routes"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.findBtnText}>Find Routes</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {errorMsg ? (
          <Card style={{ backgroundColor: `${colors.sosRed}15`, borderColor: `${colors.sosRed}40` }}>
            <Text style={{ color: colors.sosRed, fontSize: 13 }}>{errorMsg}</Text>
          </Card>
        ) : null}

        {routes.map((route) => {
          const meta = STATUS_META[route.status];
          const color = statusColor(route.status);
          return (
            <Card key={route.route_id}>
              <View style={styles.routeCardHeader}>
                <Text style={[styles.routeLabel, { color: colors.textMuted }]}>{route.label}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: color }]}>
                  <Ionicons name={meta.icon} size={14} color={color} />
                  <Text style={[styles.statusBadgeText, { color }]}>{meta.label}</Text>
                </View>
              </View>
              <Text style={[styles.routePath, { color: colors.text }]}>
                {route.path_names.join(' → ')}
              </Text>
              <View style={styles.routeStatsRow}>
                <Text style={[styles.routeStat, { color: colors.textMuted }]}>
                  Risk: {route.max_segment_risk}
                </Text>
                <Text style={[styles.routeStat, { color: colors.textMuted }]}>
                  ETA: {route.estimated_time_hr} hr
                </Text>
                <Text style={[styles.routeStat, { color: colors.textMuted }]}>
                  {route.total_distance_km} km
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  { backgroundColor: route.status === 'AVOID' ? colors.cardBorder : color },
                ]}
                onPress={() => startNavigation(route)}
                disabled={route.status === 'AVOID'}
                accessible
                accessibilityRole="button"
                accessibilityLabel={route.status === 'AVOID' ? 'Route blocked' : `Start navigation on ${route.label}`}
              >
                <Text style={styles.startBtnText}>
                  {route.status === 'AVOID' ? 'Route Blocked' : 'Start Navigation'}
                </Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>

      <Modal visible={pickerFor !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select {pickerFor === 'origin' ? 'Origin' : 'Destination'}
            </Text>
            <FlatList
              data={nodes}
              keyExtractor={(n) => n.key}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.nodeRow, { borderBottomColor: colors.cardBorder }]}
                  onPress={() => {
                    if (pickerFor === 'origin') setOrigin(item);
                    else setDestination(item);
                    setPickerFor(null);
                  }}
                >
                  <Text style={[styles.nodeName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.nodeSub, { color: colors.textMuted }]}>
                    {item.district}, {item.state}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
              onPress={() => setPickerFor(null)}
            >
              <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.sm,
  },
  pickerText: { fontSize: 14, flex: 1 },
  prefNote: { fontSize: 11, marginBottom: Spacing.sm, fontStyle: 'italic' },
  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  findBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  routePath: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  routeStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  routeStat: { fontSize: 12, fontWeight: '600' },
  startBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusLabel: { fontSize: 16, fontWeight: '900' },
  bigStat: { fontSize: 14, fontWeight: '700' },
  alertTitle: { fontSize: 14, fontWeight: '900' },
  alertBody: { fontSize: 13, marginBottom: 10 },
  rerouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: BorderRadius.md,
  },
  rerouteBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  segmentText: { fontSize: 13, fontWeight: '600' },
  segmentSub: { fontSize: 11, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: Spacing.md },
  nodeRow: { paddingVertical: 12, borderBottomWidth: 1 },
  nodeName: { fontSize: 14, fontWeight: '700' },
  nodeSub: { fontSize: 12, marginTop: 2 },
  cancelBtn: {
    marginTop: Spacing.md,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMapsNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: 8,
  },
  googleMapsNavText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
