/**
 * AutoRerouteDemo
 * ----------------
 * A ready-to-use screen that demonstrates the full "A -> Z via B/C/D,
 * auto-avoid the landslide leg" behaviour end to end, wired to the
 * useAutoReroute hook. Anshuman can either:
 *   (a) render this component directly as a screen/tab while his own
 *       map module is still uncommitted, or
 *   (b) copy the map/banner/legend JSX into his own screen -- the hook
 *       does all the logic either way.
 *
 * Uses LeafletRouteMap (OpenStreetMap tiles in a WebView), not
 * react-native-maps/Google Maps -- this renders correctly inside plain
 * Expo Go with no API key and no native build step. See LeafletRouteMap.tsx
 * for why react-native-maps doesn't work under Expo Go.
 *
 * One new dependency: react-native-webview (already installed via
 * `npx expo install react-native-webview`).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { useAutoReroute, RouteStatus } from '../hooks/useAutoReroute';
import { LeafletRouteMap } from './LeafletRouteMap';

// Demo node keys. Swap these for a real picker later, or for the driver's
// live GPS position resolved to the nearest node once that logic exists.
const DEMO_PRESETS: { label: string; origin: string; destination: string }[] = [
  { label: 'Guwahati → Silchar', origin: 'GHY', destination: 'SLC' },
  { label: 'Tezpur → Itanagar', origin: 'TEZ', destination: 'ITN' },
  { label: 'Guwahati → Shillong', origin: 'GHY', destination: 'SHL' },
];

function statusColor(status: RouteStatus | undefined, colors: any): string {
  if (status === 'AVOID') return colors.riskSevere;
  if (status === 'CAUTION') return colors.riskModerate;
  return colors.riskLow; // SAFE or unknown
}

export const AutoRerouteDemo: React.FC = () => {
  const { colors } = useTheme();
  const [preset, setPreset] = useState(DEMO_PRESETS[0]);

  const {
    activeRoute,
    alternateRoutes,
    routeCoordinates,
    isRerouting,
    rerouteAlert,
    dismissRerouteAlert,
    error,
  } = useAutoReroute({ origin: preset.origin, destination: preset.destination, enabled: true });

  const lineColor = statusColor(activeRoute?.status, colors);

  const renderPresetBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.presetBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
      {DEMO_PRESETS.map((p) => (
        <TouchableOpacity
          key={p.label}
          onPress={() => setPreset(p)}
          style={[
            styles.presetChip,
            { borderColor: colors.cardBorder, backgroundColor: colors.background },
            preset.label === p.label && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.presetText, { color: preset.label === p.label ? '#fff' : colors.textMuted }]}>{p.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStatusBadge = () => {
    if (!activeRoute) return null;
    return (
      <View style={[styles.statusBadge, { backgroundColor: lineColor }]}>
        {isRerouting && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
        <Text style={styles.statusBadgeText}>
          {activeRoute.status} · {activeRoute.path_names.join(' → ')} · {activeRoute.total_distance_km} km
        </Text>
      </View>
    );
  };

  const renderRerouteBanner = () => {
    if (!rerouteAlert) return null;
    return (
      <View style={[styles.banner, { backgroundColor: colors.sosRed }]}>
        <Ionicons name="warning" size={20} color="#fff" />
        <Text style={styles.bannerText}>{rerouteAlert.message}</Text>
        <TouchableOpacity onPress={dismissRerouteAlert}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAlternates = () => {
    if (alternateRoutes.length === 0) return null;
    return (
      <View style={[styles.altPanel, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
        <Text style={[styles.altHeader, { color: colors.textSubtle }]}>OTHER AVAILABLE ROUTES</Text>
        {alternateRoutes.map((r) => (
          <View key={r.route_id} style={styles.altRow}>
            <View style={[styles.altDot, { backgroundColor: statusColor(r.status, colors) }]} />
            <Text style={[styles.altText, { color: colors.text }]} numberOfLines={1}>
              {r.path_names.join(' → ')}
            </Text>
            <Text style={[styles.altMeta, { color: colors.textMuted }]}>{r.status}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderPresetBar()}

      {error && (
        <View style={[styles.errorBox, { backgroundColor: colors.riskHigh }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.map}>
        <LeafletRouteMap coordinates={routeCoordinates} labels={activeRoute?.path_names} color={lineColor} />
      </View>

      {renderStatusBadge()}
      {renderRerouteBanner()}
      {renderAlternates()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  presetBar: { flexDirection: 'row', padding: Spacing.sm, borderBottomWidth: 1 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.round, borderWidth: 1, marginRight: 8 },
  presetText: { fontSize: 12, fontWeight: '700' },
  statusBadge: {
    position: 'absolute', top: Spacing.md, left: Spacing.md, right: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.md,
  },
  statusBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  banner: {
    position: 'absolute', bottom: 90, left: Spacing.md, right: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.md, borderRadius: BorderRadius.md,
  },
  bannerText: { color: '#fff', flex: 1, fontSize: 13, fontWeight: '600' },
  altPanel: { padding: Spacing.md, borderTopWidth: 1 },
  altHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  altRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  altDot: { width: 8, height: 8, borderRadius: 4 },
  altText: { flex: 1, fontSize: 12 },
  altMeta: { fontSize: 11, fontWeight: '700' },
  errorBox: { padding: Spacing.sm },
  errorText: { color: '#fff', fontSize: 12, textAlign: 'center' },
  fallbackList: { flex: 1 },
  fallbackTitle: { fontWeight: '700', marginBottom: Spacing.md },
  fallbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
});
