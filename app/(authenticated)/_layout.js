import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { View, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import CustomDrawerContent from "../../components/CustomDrawerContent";
import { useAuth } from "../context/AuthContext";
import { useNotificationsStore } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";

export default function AuthenticatedLayout() {
  const { isLoggedIn, user } = useAuth();
  const { addForUser } = useNotificationsStore();
  const { t } = useLanguage();

  // Save incoming notifications for the logged in user
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      if (user?.id) {
        const { title, body, data } = notif.request?.content || {};
        addForUser(user.id, { title: title || 'Notification', body: body || '', data: data || {} });
      }
    });
    return () => sub.remove();
  }, [user?.id]);

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Drawer
      initialRouteName="Profile"
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="index" options={{ title: t('home') }} />
      <Drawer.Screen name="Profile" options={{ title: t('profile') }} />
      <Drawer.Screen name="settings" options={{ title: t('settings') }} />
      <Drawer.Screen name="notifications" options={{ title: t('notifications') }} />
    </Drawer>
  );
}
