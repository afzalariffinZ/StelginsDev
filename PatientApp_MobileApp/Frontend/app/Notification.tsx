// utils/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
// If you plan to use the router for deep linking from notifications,
// you might need to import it or pass it as a parameter.
// For now, we'll just console.log the intended navigation.
// import { router } from 'expo-router';

// --- Step 1: Configure how notifications are handled when the app is in the foreground ---
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => {
    console.log('Foreground notification handler called.');
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false, // Set to true if you want badge updates
      shouldShowBanner: true, // Explicitly show banner (iOS 17+)
      shouldShowList: true,   // Explicitly show in list (iOS 17+)
    };
  },
});

// --- Step 2: Function to request notification permissions ---
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C', // Optional
      });
      console.log('Android notification channel set.');
    } catch (e) {
      console.error('Failed to set Android notification channel:', e);
      // You might want to inform the user or handle this error
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log(`Existing permission status: ${existingStatus}. Requesting new permissions.`);
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true, // Set to true if you use badges
        allowSound: true,
        allowAnnouncements: true, // For Siri announcements, etc.
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn(`Notification permissions denied. Final status: ${finalStatus}`);
    // You could show an alert here explaining why notifications are useful
    // Alert.alert('Permissions Denied', 'You will not receive notifications.');
    return false;
  }

  console.log('Notification permissions granted.');
  return true;
}

// --- Step 3: Function to schedule a local notification ---
export async function scheduleHardcodedNotification(
  delayInSeconds: number,
  title: string,
  body: string,
  data?: Record<string, any> // Optional data payload
): Promise<string | null> {
  // Permissions are usually requested once at app startup,
  // but it's good to have a check or ensure they are granted before scheduling.
  // For this specific function, we assume permissions were already handled by the caller (e.g., in _layout.tsx)
  // OR you can add a check here:
  // const hasPermission = await requestNotificationPermissions(); // Or just getStatus without re-requesting
  // if (!hasPermission) {
  //   Alert.alert("Permissions Required", "Cannot schedule notification without permission.");
  //   return null;
  // }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,       // e.g., { screen: '/details', itemId: '123' }
        sound: 'default', // Or a custom sound file
        // You can add more properties like:
        // badge: 1,
        // subtitle: 'A friendly reminder',
        // color: '#E53935', // Android notification color
      },
      trigger: {
        seconds: delayInSeconds,
        // repeats: false, // Set to true if you want it to repeat based on this trigger
      },
    });
    console.log(`Notification scheduled with ID: ${notificationId}. Title: "${title}". Will appear in ${delayInSeconds}s.`);
    return notificationId; // Return the ID if you need to cancel it later
  } catch (error) {
    console.error("Error scheduling hardcoded notification:", error);
    Alert.alert("Error", "Could not schedule the notification. Please check console for details.");
    return null;
  }
}

// --- Step 4: Setup listener for when a user taps on or interacts with a notification ---
// This works when app is foregrounded, backgrounded, or killed (if it launches the app)
export function setupNotificationInteractionListener(): Notifications.Subscription {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('--- Notification Interaction (Response Received) ---');
    console.log('Identifier:', response.notification.request.identifier);
    console.log('Title:', response.notification.request.content.title);
    console.log('Body:', response.notification.request.content.body);
    console.log('Data:', JSON.stringify(response.notification.request.content.data));
    console.log('Action Identifier:', response.actionIdentifier); // e.g., Notifications.DEFAULT_ACTION_IDENTIFIER

    const notificationData = response.notification.request.content.data;

    // Example: Handle deep linking or specific actions based on data
    if (notificationData?.screen) {
      Alert.alert(
        "Notification Tapped!",
        `Intended screen: ${notificationData.screen}\nData: ${JSON.stringify(notificationData)}`
      );
      // Here you would typically use your navigation library
      // e.g., if (router.canGoBack()) router.push(notificationData.screen as any);
      // Make sure your router is initialized and accessible here if you use it directly.
      // Or pass a navigation callback to this function.
      console.log(`User tapped notification, intended navigation to: ${notificationData.screen}`);
    }
  });
  console.log('Notification interaction listener set up.');
  return subscription; // Return subscription to remove it later in useEffect cleanup
}

// --- Step 5 (Optional): Setup listener for when a notification is received while the app is foregrounded ---
// This is if you want to do something *additional* to the `setNotificationHandler` when a notification comes in
// while the app is open. `setNotificationHandler` already controls if it's shown.
export function setupNotificationReceivedListener(): Notifications.Subscription {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('--- Notification Received While App Foregrounded ---');
    console.log('Identifier:', notification.request.identifier);
    console.log('Title:', notification.request.content.title);
    console.log('Body:', notification.request.content.body);
    console.log('Data:', JSON.stringify(notification.request.content.data));
    // Example: You could trigger a local state update in your app, show an in-app message, etc.
    // Alert.alert("In-App Notification", `Received: ${notification.request.content.title}`);
  });
  console.log('Foreground notification received listener set up.');
  return subscription;
}


// --- Utility (Optional): Cancel a specific scheduled notification ---
export async function cancelScheduledNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Scheduled notification with ID ${notificationId} cancelled.`);
  } catch (error) {
    console.error(`Error cancelling notification ${notificationId}:`, error);
  }
}

// --- Utility (Optional): Cancel all scheduled notifications ---
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled.');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}