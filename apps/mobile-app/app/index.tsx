import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

const TUTORIAL_SEEN_KEY = '@app_has_seen_tutorial';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_SEEN_KEY)
      .then((v) => setHasSeenTutorial(v === 'true'))
      .catch(() => setHasSeenTutorial(true)); // fail open: don't block launch on storage errors
  }, []);

  if (isLoading || hasSeenTutorial === null) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.splashText, { color: colors.textMuted }]}>NER LogiSense</Text>
      </View>
    );
  }

  if (!hasSeenTutorial) {
    return <Redirect href="/tutorial" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  splashText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
