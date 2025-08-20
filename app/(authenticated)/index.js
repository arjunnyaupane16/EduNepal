
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

const classes = [
  { id: 1, title: 'Class 1', subtitle: 'Foundational studies for young learners', icon: 'tablet-android' },
  { id: 2, title: 'Class 2', subtitle: 'With engaging lessons and activities', icon: 'school' },
  { id: 3, title: 'Class 3', subtitle: 'Intermediate learning with focus', icon: 'auto-stories' },
  { id: 4, title: 'Class 4', subtitle: 'Advanced topics and applications', icon: 'leaderboard' },
  { id: 5, title: 'Class 5', subtitle: 'Comprehensive curriculum for all', icon: 'book' },
  { id: 6, title: 'Class 6', subtitle: 'Deeper dives into science, math, and more', icon: 'science' },
  { id: 7, title: 'Class 7', subtitle: 'Pre-secondary foundational content', icon: 'insights' },
  { id: 8, title: 'Class 8', subtitle: 'Secondary education basics', icon: 'emoji-objects' },
  { id: 9, title: 'Class 9', subtitle: 'Advanced secondary topics', icon: 'calculate' },
  { id: 10, title: 'Class 10', subtitle: 'Preparation for SEE Examination', icon: 'grading' },
  { id: 11, title: 'Class 11', subtitle: 'Higher secondary foundation', icon: 'psychology' },
  { id: 12, title: 'Class 12', subtitle: 'Bridge to university education', icon: 'school' },
];

export default function Index() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { getUnreadCount } = useNotificationsStore();
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
        <Text style={[styles.title, { color: theme.text }]}>EduNepal</Text>
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
          {classes.map((item) => (
            <ClassCard
              key={item.id}
              id={item.id}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              theme={theme}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar active="home" />
    </View>
  );
}
