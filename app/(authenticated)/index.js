
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../../components/Avatar';
import BottomNavBar from '../../components/BottomNavBar';
import ClassCard from '../../components/ClassCard';
import styles from '../../styles/IndexStyles';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotificationsStore } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

const classIcons = {
  1: 'tablet-android',
  2: 'school',
  3: 'auto-stories',
  4: 'leaderboard',
  5: 'book',
  6: 'science',
  7: 'insights',
  8: 'emoji-objects',
  9: 'calculate',
  10: 'grading',
  11: 'psychology',
  12: 'school',
};

export default function Index() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { getUnreadCount } = useNotificationsStore();
  const { t } = useLanguage();
  const notifCount = user ? getUnreadCount(user.id) : 0;

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <MaterialIcons name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{t('eduNepal') || 'EduNepal'}</Text>
        <View style={styles.topRightIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('notifications')}>
            <View style={styles.notifWrap}>
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
              {notifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notifCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileContainer}>
            <Avatar size={32} borderColor={theme.primary || '#007bff'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.grid}>
          {[...Array(12)].map((_, idx) => {
            const id = idx + 1;
            const title = `${t('class')} ${id}`;
            const subtitle = t(`classSubtitle${id}`);
            const icon = classIcons[id];
            return (
            <ClassCard
              key={id}
              id={id}
              icon={icon}
              title={title}
              subtitle={subtitle}
              theme={theme}
            />
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar active="home" />
    </View>
  );
}
