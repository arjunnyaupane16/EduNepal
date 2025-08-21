// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persistent keys
const SERVER_URL_KEY = 'serverUrl';
const NOTIFICATIONS_ENABLED_KEY = 'notifications:enabled';

// Helpers to get/set global notifications enabled flag (default true)
export async function getNotificationsEnabled() {
  try {
    const v = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (v === null || v === undefined) return true;
    return v === 'true';
  } catch { return true; }
}

export async function setNotificationsEnabled(enabled) {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {}
}

// Apply side effects when toggling notifications
export async function applyNotificationsEnabledSideEffects(enabled) {
  try {
    if (!enabled) {
      // Cancel all local scheduled notifications (skip on web)
      if (Platform.OS !== 'web') {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } else {
      // No-op here; registration is handled elsewhere when needed
    }
  } catch {}
}

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const enabled = await getNotificationsEnabled();
    return {
      shouldShowAlert: !!enabled,
      shouldPlaySound: !!enabled,
      shouldSetBadge: false,
    };
  },
});

// Server URL helpers
export async function getServerUrl() {
  // 1) User-saved value
  try {
    const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
    if (saved) return saved;
  } catch {}
  // 2) App config
  const fromConfig = Constants?.expoConfig?.extra?.serverUrl;
  if (fromConfig) return fromConfig;
  // 3) Default
  return 'http://localhost:4000';
}

export async function saveServerUrl(url) {
  if (!url) return;
  await AsyncStorage.setItem(SERVER_URL_KEY, url);
}

export async function registerForPushNotificationsAsync() {
  try {
    const enabled = await getNotificationsEnabled();
    if (!enabled) {
      return null;
    }
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

    // Register token to your server using resolved URL
    try {
      const base = await getServerUrl();
      await fetch(`${base}/register-token`, {
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
  const enabled = await getNotificationsEnabled();
  if (!enabled) return -1;
  // Not supported on web; safely no-op
  if (Platform.OS === 'web') {
    console.warn('[notifications] scheduleLocalRandomNotification is not supported on web. Skipping.');
    return 0;
  }
  const delaySeconds = Math.floor(Math.random() * 86400); // 0..86399
  const trigger = { seconds: delaySeconds, channelId: 'default' };
  await Notifications.scheduleNotificationAsync({
    content: { title, body: message, sound: 'default', data: { type: 'system-local' } },
    trigger,
  });
  return delaySeconds;
}
