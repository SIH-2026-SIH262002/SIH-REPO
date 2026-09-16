/**
 * LeafletRouteMap
 * ----------------
 * A Google-Maps-free map for the auto-reroute demo. Renders OpenStreetMap
 * tiles + a route polyline via Leaflet running inside a WebView.
 *
 * Why: react-native-maps on Android needs a Google Maps API key baked into
 * a native build (EAS build / expo prebuild) -- it does NOT work in plain
 * Expo Go, because Expo Go is a shared pre-built binary that can't embed a
 * per-project key. WebView, by contrast, is plain JS -- it works in Expo Go
 * with zero native build step and zero API key, using the same free OSM
 * tiles the web dashboard already uses (see apps/web-dashboard, Leaflet).
 *
 * Trade-off: needs the phone to have internet access to fetch OSM tiles
 * (same requirement Google Maps would have anyway) and there's no "my
 * location" blue dot out of the box -- fine for this demo's purpose of
 * showing the route line switch when a hazard is detected.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';

let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  // react-native-webview not installed -- caller sees the fallback message below.
}

interface LatLng {
  latitude: number;
  longitude: number;
}

interface LeafletRouteMapProps {
  coordinates: LatLng[];
  labels?: string[]; // optional popup label per coordinate, same length/order
  color: string; // route line + waypoint color, e.g. '#10b981' (safe) / '#ef4444' (avoid)
}

function buildHtml(coordinates: LatLng[], labels: string[] | undefined, color: string): string {
  const points = coordinates.map((c) => [c.latitude, c.longitude]);
  const center = points.length ? points[Math.floor(points.length / 2)] : [25.5788, 91.8933];
  const pointsJson = JSON.stringify(points);
  const labelsJson = JSON.stringify(labels ?? []);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0f172a; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var points = ${pointsJson};
    var labels = ${labelsJson};
    var map = L.map('map', { zoomControl: true }).setView([${center[0]}, ${center[1]}], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    if (points.length > 1) {
      var line = L.polyline(points, { color: '${color}', weight: 5 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
    } else if (points.length === 1) {
      map.setView(points[0], 10);
    }

    points.forEach(function (p, i) {
      var isEndpoint = (i === 0 || i === points.length - 1);
      var marker = L.circleMarker(p, {
        radius: isEndpoint ? 8 : 6,
        color: isEndpoint ? '#6366f1' : '${color}',
        fillColor: isEndpoint ? '#6366f1' : '${color}',
        fillOpacity: 1,
        weight: 2
      }).addTo(map);
      if (labels[i]) marker.bindPopup(labels[i]);
    });
  </script>
</body>
</html>`;
}

export const LeafletRouteMap: React.FC<LeafletRouteMapProps> = ({ coordinates, labels, color }) => {
  const html = useMemo(() => buildHtml(coordinates, labels, color), [coordinates, labels, color]);

  if (!WebView) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          Map unavailable: run `npx expo install react-native-webview` and reload.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        // Re-mounting on every coordinate change is intentional here: it's
        // simpler and more reliable for a demo than wiring up postMessage
        // round-trips, at the cost of a brief tile-reload flash on reroute.
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  fallbackText: { color: '#94a3b8', textAlign: 'center', fontSize: 13 },
});
