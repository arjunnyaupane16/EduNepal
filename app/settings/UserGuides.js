// app/settings/UserGuides.js
import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function UserGuides() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );

  const RowLink = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border },
      ]}
    >
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={22} color={theme.text} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Ionicons name="menu-book" size={56} color={theme.primary || '#3b82f6'} />
        <Text style={[styles.title, { color: theme.text }]}>
          {t('userGuides') || 'User Guides'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Step-by-step help to get the most out of elearn Nep</Text>
      </View>

      <Section title="Getting Started">
        <Text style={[styles.p, { color: theme.text }]}>
          1. Create your account from the Login screen.
        </Text>
        <Text style={[styles.p, { color: theme.text }]}>
          2. Complete your profile in Settings.
        </Text>
        <Text style={[styles.p, { color: theme.text }]}>
          3. Explore classes from the Home tab and start learning.
        </Text>
      </Section>

      <Section title="Core Features">
        <RowLink icon="class" title="Browse Classes" subtitle="Find classes by level and subject" onPress={() => router.push('/classes')} />
        <RowLink icon="download" title="Download PDFs" subtitle="Open and study materials offline" onPress={() => {}} />
        <RowLink icon="notifications-active" title="Notifications" subtitle="Manage alerts and reminders" onPress={() => router.push('/settings/NotificationSettings')} />
        <RowLink icon="privacy-tip" title="Privacy Settings" subtitle="Control your data and permissions" onPress={() => router.push('/settings/PrivacySettings')} />
      </Section>

      <Section title="Account & Security">
        <RowLink icon="lock" title="Change Password" onPress={() => router.push('/settings/UpdatePassword')} />
        <RowLink icon="alternate-email" title="Update Email" onPress={() => router.push('/settings/UpdateEmail')} />
        <RowLink icon="person-remove" title="Delete Account" onPress={() => router.push('/settings/DeleteAccount')} />
      </Section>

      <Section title="Tips & Best Practices">
        <Text style={[styles.p, { color: theme.text }]}>• Keep your app updated for the latest features.</Text>
        <Text style={[styles.p, { color: theme.text }]}>• Enable notifications to get reminders for new content.</Text>
        <Text style={[styles.p, { color: theme.text }]}>• Use dark mode at night for comfortable reading.</Text>
      </Section>

      <Section title="Troubleshooting">
        <Text style={[styles.p, { color: theme.text }]}>• If PDFs don’t open, check storage permissions in system settings.</Text>
        <Text style={[styles.p, { color: theme.text }]}>• If notifications don’t arrive, open app settings and ensure permissions are enabled.</Text>
        <Text style={[styles.p, { color: theme.text }]}>• Clear cache by reinstalling the app if content seems outdated.</Text>
      </Section>

      <Section title="More Help">
        <RowLink icon="support-agent" title="Contact Support" subtitle="elearnnep@16gmail.com" onPress={() => Linking.openURL('mailto:elearnnep@16gmail.com?subject=Support:%20elearn%20Nep')} />
        <RowLink icon="public" title="Website" subtitle="www.elearn.com" onPress={() => Linking.openURL('https://www.elearn.com')} />
        <RowLink icon="policy" title="Privacy Policy" onPress={() => router.push('/settings/PrivacyPolicy')} />
        <RowLink icon="gavel" title="Terms & Conditions" onPress={() => router.push('/settings/Terms')} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },

  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, marginTop: 2, opacity: 0.8 },

  p: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
});
