import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface CardProps {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  actionText?: string;
  onAction?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon,
  iconColor = Colors.primary,
  children,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {title && (
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
              <Ionicons name={icon} size={18} color={iconColor} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    flexDirection: 'column',
  },
});
