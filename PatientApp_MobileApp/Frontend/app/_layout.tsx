import React, { useEffect, useRef } from 'react'; // Added useEffect, useRef
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router'; // Added SplashScreen
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications'; // Added Notifications
import { LogBox, Platform } from 'react-native';

import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Assuming your notificationService.ts is in ../utils/notificationService.ts
// Adjust the path if it's different.
import {
  requestNotificationPermissions,
  scheduleHardcodedNotification,
  setupNotificationInteractionListener,
  // setupNotificationReceivedListener // Optional, if you need to handle notifications received in foreground
} from './Notification'; // <--- MAKE SURE THIS PATH IS CORRECT

// --- Notification Configuration ---
const NOTIFICATION_DELAY_SECONDS = 60 * 1; // Example: 5 minutes. Change as needed.
const NOTIFICATION_TITLE = "Medication Reminder 💊";
const NOTIFICATION_BODY = "It's time to take your medication. Stay healthy and take care!";
const NOTIFICATION_DATA = { screen: '/some-target-screen' }; // Optional: for deep linking when tapped

function AppStackWithLanguageKey() {
  const { language, t } = useLanguage(); // Assuming 't' is available for potential translated messages
  const colorScheme = useColorScheme();
  const interactionListener = useRef<Notifications.Subscription>();
  // const receivedListener = useRef<Notifications.Subscription>(); // Optional

  useEffect(() => {
    let isMounted = true;

    async function initializeAppNotifications() {
      console.log("Attempting to initialize app notifications...");
      const permissionsGranted = await requestNotificationPermissions();

      if (Platform.OS === 'android') { // Only in dev mode and on Android
        // Check if running in Expo Go (a common way, though not foolproof)
        // Constants.expoConfig.hostUri might be more reliable if available early
        // For simplicity, this targets the known warning string.
        LogBox.ignoreLogs([
          "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go."
        ]);
        // You might want a more general pattern if the message slightly changes:
        // LogBox.ignoreLogs([/expo-notifications: Android Push notifications/]);
      }

      if (permissionsGranted && isMounted) {
        console.log("Notification permissions granted. Scheduling hardcoded notification.");
        await scheduleHardcodedNotification(
          NOTIFICATION_DELAY_SECONDS,
          NOTIFICATION_TITLE,
          NOTIFICATION_BODY,
          NOTIFICATION_DATA
        );
        console.log(`Hardcoded notification scheduled for ${NOTIFICATION_DELAY_SECONDS} seconds from now.`);
      } else if (isMounted) {
        console.warn("Notification permissions were not granted or component unmounted.");
      }

      // Setup listener for when user taps a notification
      if (isMounted) {
        interactionListener.current = setupNotificationInteractionListener();
        // receivedListener.current = setupNotificationReceivedListener(); // Optional
        console.log("Notification interaction listener set up.");
      }
    }

    // Only run initialization once
    if (isMounted) {
      initializeAppNotifications();
    }

    return () => {
      isMounted = false;
      // Cleanup listeners
      if (interactionListener.current) {
        Notifications.removeNotificationSubscription(interactionListener.current);
        console.log("Notification interaction listener removed.");
      }
      // if (receivedListener.current) {
      //   Notifications.removeNotificationSubscription(receivedListener.current);
      // }
    };
  }, []); // Empty dependency array means this runs once when AppStackWithLanguageKey mounts

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar hidden={true} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ // Capture error for debugging
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded or if there's an error
    }
  }, [loaded, error]);


  useEffect(() => {
    // Prevent auto-hiding splash screen until fonts are loaded
    SplashScreen.preventAutoHideAsync();
  }, []);


  if (!loaded && !error) { // Show splash/null only if fonts are still loading and no error
    return null;
  }

  // If there was a font loading error, you might want to display an error message
  // or a fallback UI instead of just proceeding. For now, we'll proceed.
  // if (error) {
  //   console.error("Font loading error:", error);
  //   // return <Text>Error loading fonts.</Text>; // Example error UI
  // }


  return (
    <LanguageProvider>
      <AppStackWithLanguageKey />
    </LanguageProvider>
  );
}