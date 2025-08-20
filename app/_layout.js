import { Stack } from "expo-router";
import { useEffect } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import * as Notifications from 'expo-notifications';
import { useAuth } from './context/AuthContext';
import { useNotificationsStore } from './context/NotificationContext';

function NotificationBridge() {
  const { user } = useAuth();
  const { addForUser } = useNotificationsStore();

  useEffect(() => {
    // Register device and send token to server
    registerForPushNotificationsAsync();
    // Listen for foreground notifications and store to in-app history
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      try {
        const title = notif?.request?.content?.title || 'Notification';
        const body = notif?.request?.content?.body || '';
        const data = notif?.request?.content?.data || {};
        const uid = user?.id || user?.username || 'guest';
        addForUser(uid, { title, message: body, data });
      } catch {}
    });
    return () => { sub && sub.remove && sub.remove(); };
  }, [user?.id, user?.username]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <NotificationBridge />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="forgot" options={{ headerShown: false }} />
              <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
            </Stack>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
