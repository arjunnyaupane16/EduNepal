// app/settings/_layout.js
import { Stack } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsStackLayout() {
  const { t } = useLanguage();
  return (
    <Stack screenOptions={{ headerShown: true }}>
      {/* Hide header on the main settings screen so only bottom navbar shows */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="AccountSecurity" options={{ title: t('accountSecurity') }} />
      <Stack.Screen name="AdminDashboard" options={{ title: t('adminDashboard') }} />
      <Stack.Screen name="SystemNotifications" options={{ title: t('systemNotifications') }} />
      <Stack.Screen name="SystemLogs" options={{ title: t('systemLogs') }} />
      <Stack.Screen name="DeveloperTools" options={{ title: t('developerTools') }} />
      <Stack.Screen name="NotificationSettings" options={{ title: t('notificationSettings') }} />
      <Stack.Screen name="LanguageRegion" options={{ title: t('languageRegion') }} />
      <Stack.Screen name="RegionSettings" options={{ title: t('regionSettings') }} />
      <Stack.Screen name="PrivacySettings" options={{ title: t('privacySettings') }} />
      <Stack.Screen name="Terms" options={{ title: t('termsConditions') }} />
      <Stack.Screen name="AboutApp" options={{ title: t('aboutApp') }} />
      <Stack.Screen name="PrivacyPolicy" options={{ title: t('privacyPolicy') }} />
      <Stack.Screen name="HelpSupport" options={{ title: t('helpSupport') }} />
      <Stack.Screen name="UserGuides" options={{ title: t('userGuides') }} />
      <Stack.Screen name="UpdatePassword" options={{ title: t('updatePassword') }} />
      <Stack.Screen name="UpdateEmail" options={{ title: t('updateEmail') }} />
      <Stack.Screen name="DeleteAccount" options={{ title: t('deleteAccount') }} />
    </Stack>
  );
}
