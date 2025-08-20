import { Stack } from "expo-router";
import { useEffect } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { registerForPushNotificationsAsync } from "../utils/notifications";

export default function RootLayout() {
  useEffect(() => {
    // Register device and send token to server
    registerForPushNotificationsAsync();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
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
