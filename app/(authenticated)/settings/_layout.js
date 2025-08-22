import { Stack } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';

export default function SettingsLayout() {
  const { t } = useLanguage();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AdminDashboard"
        options={{
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="DeleteAccount"
        options={{
          title: t('deleteAccount'),
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
