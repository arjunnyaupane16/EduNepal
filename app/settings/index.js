import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
// Removed TopNavBar to avoid duplicate navbars on the Settings screen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', paddingHorizontal: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  profileBox: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 3,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  initialsText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileEmail: { fontSize: 14, marginTop: 4 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, letterSpacing: 0.3, textTransform: 'uppercase' },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  textWrap: { flex: 1, marginLeft: 12 },
  label: { fontSize: 16, fontWeight: '600' },
  subLabel: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }
});

const Section = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
};

const SettingsItem = ({ icon, label, subLabel, onPress, theme }) => (
  <TouchableOpacity style={[styles.item, { backgroundColor: theme?.cardBackground || '#fff' }]} onPress={onPress}>
    <MaterialIcons name={icon} size={22} color={theme?.text || "#333"} />
    <View style={styles.textWrap}>
      <Text style={[styles.label, { color: theme?.text || '#333' }]}>{label}</Text>
      {subLabel && <Text style={[styles.subLabel, { color: theme?.secondaryText || '#777' }]}>{subLabel}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color="#aaa" />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const isAdmin = user?.role === 'Administrator' || user?.role === 'admin';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background, paddingTop: 0 }]} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={[styles.profileBox, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: 'transparent', padding: 0 }] }>
              <Avatar size={56} borderColor={theme.primary || '#007bff'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: theme.text }]}>{user?.fullName || user?.name || 'User'}</Text>
              <Text style={[styles.profileEmail, { color: theme.secondaryText }]}>{user?.email || 'user@edunepal.com'}</Text>
            </View>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: isAdmin ? '#dc2626' : '#3b82f6', marginTop: 12 }]}>
            <Text style={styles.roleText}>{isAdmin ? 'Administrator' : 'Student'}</Text>
          </View>
        </View>

        {/* Admin Only Sections */}
        {isAdmin && (
          <>
            <Section title="Admin Controls">
              <SettingsItem icon="dashboard" label="Admin Dashboard" subLabel="Manage users, content, and system" onPress={() => router.push('/settings/AdminDashboard')} theme={theme} />
            </Section>

            {/* System Settings moved under Admin Dashboard */}
          </>
        )}

        <Section title="Account Security">
          <SettingsItem icon="lock" label="Change Password" subLabel="Update your account security settings" onPress={() => router.push('/settings/UpdatePassword')} theme={theme} />
          <SettingsItem icon="alternate-email" label="Update Email Address" subLabel="Change your email" onPress={() => router.push('/settings/UpdateEmail')} theme={theme} />
          <SettingsItem icon="person-remove" label="Delete Account" subLabel="Permanently delete your account" onPress={() => router.push('/settings/DeleteAccount')} theme={theme} />
        </Section>

        <Section title="Privacy & Data">
          <SettingsItem icon="privacy-tip" label="Privacy Dashboard" onPress={() => router.push('/settings/PrivacySettings')} theme={theme} />
          <SettingsItem icon="gavel" label={t('termsConditions')} onPress={() => router.push('/settings/Terms')} theme={theme} />
        </Section>

        <Section title="Notifications">
          <SettingsItem icon="notifications-active" label="Notification Settings" subLabel="Manage all notification preferences" onPress={() => router.push('/settings/NotificationSettings')} theme={theme} />
          {/* Admin-only system tools moved inside Admin Dashboard */}
        </Section>

        <Section title="Preferences">
          <SettingsItem icon="translate" label={t('language')} subLabel="Choose your preferred language" onPress={() => router.push('/settings/LanguageRegion')} theme={theme} />
          <SettingsItem icon="public" label="Content Region" subLabel="Nepal" onPress={() => router.push('/settings/RegionSettings')} theme={theme} />
          <SettingsItem icon="palette" label="Theme Settings" subLabel="Light, Dark, or Auto" onPress={() => router.push('/theme')} theme={theme} />
        </Section>

        <Section title={t('helpSupport')}>
          <SettingsItem icon="help-outline" label="FAQs" onPress={() => router.push('/settings/HelpSupport')} theme={theme} />
          <SettingsItem icon="support-agent" label={t('contactUs')} onPress={() => router.push('/settings/Contact')} theme={theme} />
          <SettingsItem icon="menu-book" label="User Guides" onPress={() => router.push('/settings/UserGuides')} theme={theme} />
          {/* Admin-only System Logs moved inside Admin Dashboard */}
        </Section>

        <Section title="About">
          <SettingsItem icon="info" label="Application Version" subLabel="1.0.0" onPress={() => router.push('/settings/AboutApp')} theme={theme} />
          <SettingsItem icon="security" label="Privacy Policy" onPress={() => router.push('/settings/PrivacyPolicy')} theme={theme} />
          {/* Admin-only Developer Tools moved inside Admin Dashboard */}
        </Section>

        <Section title="Account Actions">
          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.primary }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </View>
  );
}
