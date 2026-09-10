import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/theme';

export default function Index() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (token && user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, user, token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>NER LogiSense</Text>
      <Text style={styles.subtext}>Connecting to Risk & Accessibility Intelligence Platform...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});
