import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOffline } from '../context/OfflineContext';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const OfflineQueueBanner: React.FC = () => {
  const { pendingCount, isSyncing, syncOfflineQueue } = useOffline();

  if (pendingCount === 0) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <Ionicons name="cloud-offline" size={18} color={Colors.warning} />
        <Text style={styles.text}>
          {pendingCount} offline report{pendingCount > 1 ? 's' : ''} queued
        </Text>
      </View>
      <TouchableOpacity
        style={styles.syncButton}
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
    backgroundColor: `${Colors.warning}20`,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.warning}50`,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning,
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
