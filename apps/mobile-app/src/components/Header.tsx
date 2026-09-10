import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;
  onRightAction?: () => void;
  badgeText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightActionIcon,
  onRightAction,
  badgeText,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badgeText && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {rightActionIcon && onRightAction && (
        <TouchableOpacity style={styles.iconButton} onPress={onRightAction} activeOpacity={0.7}>
          <Ionicons name={rightActionIcon} size={22} color={Colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
});
