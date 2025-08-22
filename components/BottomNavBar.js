import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import styles from '../styles/BottomNavBarStyles';
import { useAuth } from '../app/context/AuthContext';
import { useLanguage } from '../app/context/LanguageContext';

export default function BottomNavBar({ active }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Function to get user initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={() => router.push('/')} style={styles.iconContainer} accessibilityRole="button" accessibilityLabel={t('home')}>
        <Ionicons name="home-outline" size={24} color={active === 'home' ? '#007bff' : '#555'} />
        <Text style={styles.label}>{t('home')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/downloads')} style={styles.iconContainer} accessibilityRole="button" accessibilityLabel={t('downloads')}>
        <Ionicons name="download-outline" size={24} color={active === 'downloads' ? '#007bff' : '#555'} />
        <Text style={styles.label}>{t('downloads')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconContainer} accessibilityRole="button" accessibilityLabel={t('settings')}>
        <Ionicons name="settings-outline" size={24} color={active === 'settings' ? '#007bff' : '#555'} />
        <Text style={styles.label}>{t('settings')}</Text>
      </TouchableOpacity>
    </View>
  );
}
