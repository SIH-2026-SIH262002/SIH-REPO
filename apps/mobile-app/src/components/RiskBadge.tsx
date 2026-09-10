import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RiskCategory } from '../types';
import { RiskColors, BorderRadius } from '../constants/theme';

interface RiskBadgeProps {
  category: RiskCategory | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const catKey = (category || 'LOW').toUpperCase() as keyof typeof RiskColors;
  const color = RiskColors[catKey] || RiskColors.LOW;

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}20`, borderColor: `${color}50` },
        isLg && styles.badgeLg,
        isSm && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, isLg && styles.textLg, isSm && styles.textSm]}>
        {category} {score !== undefined ? `(${score.toFixed(0)})` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textLg: {
    fontSize: 14,
  },
  textSm: {
    fontSize: 10,
  },
});
