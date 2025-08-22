import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { useLanguage } from '../app/context/LanguageContext';
import { useTheme } from '../app/context/ThemeContext';

const DrawerItemBox = ({ icon, label, desc, onPress, theme }) => (
  <TouchableOpacity onPress={onPress} style={[styles.box, { backgroundColor: theme.background }]} accessibilityRole="button" accessibilityLabel={`${label}. ${desc}`}>
    <View style={styles.row}>
      <MaterialIcons name={icon} size={22} color={theme.text} />
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.desc, { color: theme.text }]}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.text} />
    </View>
  </TouchableOpacity>
);

export default function CustomDrawerContent(props) {
  const { theme } = useTheme();
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.container, { backgroundColor: theme.background, paddingBottom: 40 }]}
    >
      <Text style={[styles.section, { color: theme.text }]}>{t('general')}</Text>

      <DrawerItemBox
        icon="home"
        label={t('home')}
        desc={t('drawerDescHome')}
        onPress={() => router.push('/(authenticated)')}
        theme={theme}
      />

      <DrawerItemBox
        icon="person"
        label={t('profile')}
        desc={t('drawerDescProfile')}
        onPress={() => router.push('/(authenticated)/Profile')}
        theme={theme}
      />

      <DrawerItemBox
        icon="settings"
        label={t('settings')}
        desc={t('drawerDescSettings')}
        onPress={() => router.push('/settings')}
        theme={theme}
      />

      <DrawerItemBox
        icon="language"
        label={t('language')}
        desc={t('drawerDescLanguage')}
        onPress={() => router.push('/settings/LanguageRegion')}
        theme={theme}
      />

      <DrawerItemBox
        icon="download"
        label={t('downloads')}
        desc={t('drawerDescDownloads')}
        onPress={() => router.push('/downloads')}
        theme={theme}
      />

      <DrawerItemBox
        icon="palette"
        label={t('theme')}
        desc={t('drawerDescTheme')}
        onPress={() => router.push('/theme')}
        theme={theme}
      />

      {/* Admin section */}
      {(user?.role === 'Administrator' || ['admin', '_arjunnn9y8a7u6pa4n3e2'].includes(user?.username)) && (
        <View>
          <Text style={[styles.section, { color: theme.text }]}>{t('admin')}</Text>
          <DrawerItemBox
            icon="campaign"
            label={t('adminNotificationCenter')}
            desc={t('adminNotificationCenterDesc')}
            onPress={() => router.push('/settings/SystemNotifications')}
            theme={theme}
          />
        </View>
      )}

      <Text style={[styles.section, { color: theme.text }]}>{t('supportAccount')}</Text>

      <DrawerItemBox
        icon="help-outline"
        label={t('helpSupport')}
        desc={t('drawerDescHelpSupport')}
        onPress={() => router.push('/settings/HelpSupport')}
        theme={theme}
      />

      <DrawerItemBox
        icon="gavel"
        label={t('termsConditions')}
        desc={t('drawerDescTerms')}
        onPress={() => router.push('/settings/Terms')}
        theme={theme}
      />

      <DrawerItemBox
        icon="contact-page"
        label={t('contactUs')}
        desc={t('drawerDescContactUs')}
        onPress={() => router.push('/settings/Contact')}
        theme={theme}
      />

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button" accessibilityLabel={t('logout')}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  box: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  desc: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#ec407a',
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
});
