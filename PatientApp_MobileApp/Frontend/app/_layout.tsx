// app/_layout.tsx
import React, { useEffect, useRef } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { LogBox, Platform } from 'react-native';

import { LanguageProvider, useLanguage } from './i18n/LanguageContext'; // Assuming this is the correct path
import { useColorScheme } from '@/hooks/useColorScheme';

// Assuming your notificationService.ts is in the same directory as _layout.tsx
// or adjust path accordingly. For instance, if Notification.ts is in 'app/' directory.
import {
  requestNotificationPermissions,
  scheduleHardcodedNotification,
  setupNotificationInteractionListener,
  // setupNotificationReceivedListener // Optional
} from './Notification'; // Adjust path if './Notification.ts' is not correct

// --- Import ChatProvider ---
import { ChatProvider } from './ChatContext'; // Adjust path if your contexts folder is elsewhere

// --- Notification Configuration ---
const NOTIFICATION_DELAY_SECONDS = 60 * 1; // Example: 1 minute
const NOTIFICATION_TITLE = "Medication Reminder 💊";
const NOTIFICATION_BODY = "It's time to take your medication. Stay healthy and take care!";
const NOTIFICATION_DATA = { screen: '/ProgressScreen' }; // Example: deep link to ProgressScreen

function AppStackWithProviders() {
  const { language, t } = useLanguage();
  const colorScheme = useColorScheme();
  const interactionListener = useRef<Notifications.Subscription>();

  LogBox.ignoreLogs(["Warning: Text strings must be rendered within a <Text> component."]);
  
  useEffect(() => {
    let isMounted = true;

    async function initializeAppNotifications() {
      console.log("Attempting to initialize app notifications...");
      const permissionsGranted = await requestNotificationPermissions();

      if (Platform.OS === 'android') {
        LogBox.ignoreLogs([
          "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go."
        ]);
      }

      if (permissionsGranted && isMounted) {
        console.log("Notification permissions granted. Scheduling hardcoded notification.");
        await scheduleHardcodedNotification(
          NOTIFICATION_DELAY_SECONDS,
          // Use t() for translated strings if available and desired for notifications
          NOTIFICATION_TITLE,
          NOTIFICATION_BODY,
          NOTIFICATION_DATA
        );
        console.log(`Hardcoded notification scheduled for ${NOTIFICATION_DELAY_SECONDS} seconds from now.`);
      } else if (isMounted) {
        console.warn("Notification permissions were not granted or component unmounted.");
      }

      if (isMounted) {
        interactionListener.current = setupNotificationInteractionListener();
        console.log("Notification interaction listener set up.");
      }
    }

    if (isMounted) {
      initializeAppNotifications();
    }

    return () => {
      isMounted = false;
      if (interactionListener.current) {
        Notifications.removeNotificationSubscription(interactionListener.current);
        console.log("Notification interaction listener removed.");
      }
    };
  }, [t]); // Added 't' as a dependency if used in notification text

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* List your screens here */}
        <Stack.Screen name="LanguageScreen" />
        <Stack.Screen name="AIChatScreen" />
        <Stack.Screen name="DataConsentScreen" />
        <Stack.Screen name="HomeScreen" />
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="PermissionsScreen" />
        <Stack.Screen name="ProgressScreen" />
        <Stack.Screen name="SettingsScreen" />
        <Stack.Screen name="SignUpScreen" />
        <Stack.Screen name="FitnessSummaryScreen" />
        <Stack.Screen name="ProfileScreen" />
        {/* Add other screens as needed */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar hidden={true} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), // Adjust path if needed
  });

  useEffect(() => {
    // Prevent auto-hiding splash screen until fonts are loaded
    // This should be called before any potential hideAsync calls.
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);


  if (!loaded && !error) {
    return null; // Keep showing splash screen (or native launch screen)
  }

  if (error) {
    console.error("Font loading error:", error);
    // Optionally, render a fallback UI here or just proceed
  }

  return (
    <LanguageProvider>
      <ChatProvider> {/* ChatProvider wraps the part of the app that needs chat state */}
        <AppStackWithProviders />
      </ChatProvider>
    </LanguageProvider>
  );
}