import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
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
  iconColor,
  children,
  style,
}) => {
  const { colors } = useTheme();
  const activeIconColor = iconColor || colors.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
    >
      {title && (
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${activeIconColor}15` }]}>
              <Ionicons name={icon} size={18} color={activeIconColor} />
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
  },
  body: {
    flexDirection: 'column',
  },
});
