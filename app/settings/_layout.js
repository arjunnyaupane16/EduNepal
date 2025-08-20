// app/settings/_layout.js
import { Stack } from 'expo-router';

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      {/* Hide header on the main settings screen so only bottom navbar shows */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="AccountSecurity" options={{ title: 'Account Security' }} />
      <Stack.Screen name="AdminDashboard" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="SystemNotifications" options={{ title: 'System Notifications' }} />
      <Stack.Screen name="SystemLogs" options={{ title: 'System Logs' }} />
      <Stack.Screen name="DeveloperTools" options={{ title: 'Developer Tools' }} />
      <Stack.Screen name="NotificationSettings" options={{ title: 'Notification Settings' }} />
      <Stack.Screen name="LanguageRegion" options={{ title: 'Language & Region' }} />
      <Stack.Screen name="RegionSettings" options={{ title: 'Region Settings' }} />
      <Stack.Screen name="PrivacySettings" options={{ title: 'Privacy Settings' }} />
      <Stack.Screen name="Terms" options={{ title: 'Terms & Conditions' }} />
      <Stack.Screen name="AboutApp" options={{ title: 'About App' }} />
      <Stack.Screen name="PrivacyPolicy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="HelpSupport" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="UpdatePassword" options={{ title: 'Update Password' }} />
      <Stack.Screen name="UpdateEmail" options={{ title: 'Update Email' }} />
      <Stack.Screen name="DeleteAccount" options={{ title: 'Delete Account' }} />
    </Stack>
  );
}
