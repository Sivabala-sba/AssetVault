import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { Stack, SplashScreen, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme } from '../src/theme';
import { useSettingsStore } from '../src/store/settingsStore';
import { initDatabase } from '../src/db/migrations';
import { initNotifications, addNotificationResponseListener } from '../src/services/notifications';
import '../src/i18n';

// Keep splash screen up while we initialise
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.themePreference);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const theme =
    themePreference === 'light'
      ? LightTheme
      : themePreference === 'dark'
      ? DarkTheme
      : systemColorScheme === 'dark'
      ? DarkTheme
      : LightTheme;

  useEffect(() => {
    Promise.all([initDatabase(), initNotifications()])
      .then(() => {
        setDbReady(true);
        SplashScreen.hideAsync();
      })
      .catch((e) => {
        console.error('App init failed:', e);
        setDbError('App initialisation failed. Please restart the app.');
        SplashScreen.hideAsync();
      });

    // Handle tapping a notification to open the asset
    const removeNotificationListener = addNotificationResponseListener((assetId) => {
      router.push(`/asset/${assetId}` as any);
    });

    return () => {
      removeNotificationListener();
    };
  }, []);

  if (!dbReady && !dbError) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, textAlign: 'center', margin: 24 }}>
          {dbError}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
