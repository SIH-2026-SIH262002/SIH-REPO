import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

/**
 * Off-screen renderer that burns a GPS + timestamp caption onto a photo
 * (classic "GPS Camera" style watermark, printed below the image), then
 * hands back a new local file URI for the composited image.
 *
 * Rendered at a fixed size well off-screen -- ViewShot needs the view to
 * actually be laid out and painted before capture, so this can't be a
 * headless/invisible-by-opacity render; it's pushed outside the viewport
 * with `position: absolute` + a large negative offset instead.
 */

interface PhotoWatermarkProps {
  photoUri: string;
  lat: number;
  lon: number;
  timestampIso: string;
  locationLabel?: string;
  onDone: (watermarkedUri: string) => void;
  onError: (error: unknown) => void;
}

const CAPTURE_WIDTH = 1080;
const CAPTURE_HEIGHT = 1080;

function formatCaption(lat: number, lon: number, timestampIso: string, locationLabel?: string) {
  const d = new Date(timestampIso);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const coordStr = `${lat.toFixed(6)}°N, ${lon.toFixed(6)}°E`;
  return { dateStr, timeStr, coordStr, locationLabel };
}

export const PhotoWatermark: React.FC<PhotoWatermarkProps> = ({
  photoUri,
  lat,
  lon,
  timestampIso,
  locationLabel,
  onDone,
  onError,
}) => {
  const shotRef = useRef<ViewShot>(null);
  const { dateStr, timeStr, coordStr } = formatCaption(lat, lon, timestampIso, locationLabel);

  useEffect(() => {
    // Give the Image + text a render pass before capturing.
    const timer = setTimeout(async () => {
      try {
        if (!shotRef.current?.capture) {
          throw new Error('ViewShot ref not ready');
        }
        const uri = await shotRef.current.capture();
        onDone(uri);
      } catch (e) {
        onError(e);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [photoUri]);

  return (
    <View style={styles.offscreenWrapper} pointerEvents="none">
      <ViewShot
        ref={shotRef}
        options={{ format: 'jpg', quality: 0.85, width: CAPTURE_WIDTH }}
        style={{ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT, backgroundColor: '#000' }}
      >
        <Image
          source={{ uri: photoUri }}
          style={{ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT }}
          resizeMode="cover"
        />
        <View style={styles.captionBar}>
          {locationLabel ? <Text style={styles.captionLine}>{locationLabel}</Text> : null}
          <Text style={styles.captionLine}>GPS: {coordStr}</Text>
          <Text style={styles.captionLine}>
            {dateStr} • {timeStr}
          </Text>
          <Text style={styles.captionBrand}>NER LogiSense — Field Verified</Text>
        </View>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  offscreenWrapper: {
    position: 'absolute',
    top: -10000,
    left: -10000,
  },
  captionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  captionLine: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  captionBrand: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
