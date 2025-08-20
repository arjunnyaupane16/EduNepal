import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { View, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import CustomDrawerContent from "../../components/CustomDrawerContent";
import { useAuth } from "../context/AuthContext";
import { useNotificationsStore } from "../context/NotificationContext";

export default function AuthenticatedLayout() {
  const { isLoggedIn, user } = useAuth();
  const { addForUser } = useNotificationsStore();

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
      <Drawer.Screen name="index" options={{ title: "Home" }} />
      <Drawer.Screen name="Profile" options={{ title: "Profile" }} />
      <Drawer.Screen name="settings" options={{ title: "Settings" }} />
      <Drawer.Screen name="theme" options={{ title: "Theme" }} />
      <Drawer.Screen name="downloads" options={{ title: "Downloads" }} />
    </Drawer>
  );
}
