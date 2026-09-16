import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.titleLines}>
              <View style={[styles.lineLong, { backgroundColor: colors.cardBorder }]} />
              <View style={[styles.lineShort, { backgroundColor: colors.cardBorder }]} />
            </View>
          </View>
          <View style={[styles.bodyLine, { backgroundColor: colors.cardBorder }]} />
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
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
  },
  titleLines: {
    flex: 1,
    gap: 6,
  },
  lineLong: {
    height: 14,
    width: '70%',
    borderRadius: 4,
  },
  lineShort: {
    height: 10,
    width: '40%',
    borderRadius: 4,
  },
  bodyLine: {
    height: 12,
    width: '90%',
    borderRadius: 4,
    marginTop: 8,
  },
});
