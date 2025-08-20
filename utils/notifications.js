// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Use server URL from app config if provided (better for physical devices)
const SERVER_URL = Constants?.expoConfig?.extra?.serverUrl ?? 'http://localhost:4000';

export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Android needs a channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token permissions');
      return null;
    }

    // Try to infer projectId; if not available, fall back to calling without options (Expo Go sometimes infers it)
    const inferredProjectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    let tokenResponse;
    try {
      tokenResponse = inferredProjectId
        ? await Notifications.getExpoPushTokenAsync({ projectId: inferredProjectId })
        : await Notifications.getExpoPushTokenAsync();
    } catch (e) {
      console.warn('getExpoPushTokenAsync failed, no projectId available. Skipping push token registration.\n', e?.message || e);
      return null;
    }
    const token = tokenResponse.data;
    console.log('Expo push token:', token);

    // Register token to your server
    try {
      await fetch(`${SERVER_URL}/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (e) {
      console.warn('Failed to register token to server:', e?.message || e);
    }

    return token;
  } catch (err) {
    console.error('registerForPushNotificationsAsync error', err);
    return null;
  }
}

export async function scheduleLocalRandomNotification(message, title = 'EduNepal') {
  const delaySeconds = Math.floor(Math.random() * 86400); // 0..86399
  const trigger = { seconds: delaySeconds, channelId: 'default' };
  await Notifications.scheduleNotificationAsync({
    content: { title, body: message, sound: 'default', data: { type: 'system-local' } },
    trigger,
  });
  return delaySeconds;
}
