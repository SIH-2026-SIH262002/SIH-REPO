import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOffline } from '../context/OfflineContext';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const OfflineQueueBanner: React.FC = () => {
  const { pendingCount, isSyncing, syncOfflineQueue } = useOffline();
  const { colors } = useTheme();

  if (pendingCount === 0) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: `${colors.warning}20`,
          borderBottomColor: `${colors.warning}50`,
        },
      ]}
    >
      <View style={styles.left}>
        <Ionicons name="cloud-offline" size={18} color={colors.warning} />
        <Text style={[styles.text, { color: colors.text }]}>
          {pendingCount} offline report{pendingCount > 1 ? 's' : ''} queued
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.syncButton, { backgroundColor: colors.warning }]}
        onPress={syncOfflineQueue}
        disabled={isSyncing}
        activeOpacity={0.7}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="sync" size={14} color="#fff" />
            <Text style={styles.syncText}>Sync Now</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  syncText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
