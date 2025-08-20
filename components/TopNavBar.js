import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';
import { useAuth } from '../app/context/AuthContext';
import { useTheme } from '../app/context/ThemeContext';
import { useLanguage } from '../app/context/LanguageContext';

export default function TopNavBar({ title, showMenu = true, showNotifications = true }) {
  const navigation = useNavigation();
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const resolvedTitle = title ?? t('eduNepal');

  // Debug logging
  console.log('TopNavBar - User:', user);
  console.log('TopNavBar - IsLoggedIn:', isLoggedIn);

  // Function to get user initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Get user display name and initials with fallbacks
  const displayName = user?.fullName || user?.name || 'User';
  const userInitials = getInitials(displayName);

  return (
    <View style={styles.topBar}>
      {showMenu && (
        <TouchableOpacity onPress={() => navigation.openDrawer?.() || router.back()}>
          <MaterialIcons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
      )}
      
      <Text style={[styles.title, { color: theme.text }]}>{resolvedTitle}</Text>
      
      <View style={styles.topRightIcons}>
        {showNotifications && (
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
        )}
        <TouchableOpacity onPress={() => router.push('/Profile')} style={styles.profileContainer}>
          <Avatar size={32} borderColor={theme.primary || '#007bff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    width: 32,
    height: 32,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Avatar handles its own image and fallback styling
};
