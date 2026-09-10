import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar} />
            <View style={styles.titleLines}>
              <View style={styles.lineLong} />
              <View style={styles.lineShort} />
            </View>
          </View>
          <View style={styles.bodyLine} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardBorder,
  },
  titleLines: {
    flex: 1,
    gap: 6,
  },
  lineLong: {
    height: 14,
    width: '70%',
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
  },
  lineShort: {
    height: 10,
    width: '40%',
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
  },
  bodyLine: {
    height: 12,
    width: '90%',
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
    marginTop: 8,
  },
});
