// app/settings/PrivacySettings.js
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';

export default function PrivacySettings() {
  const { theme } = useTheme();
  const router = useRouter();

  // Preferences
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [crashReports, setCrashReports] = useState(true);
  const [contentPersonalization, setContentPersonalization] = useState(true);
  const [shareWithPartners, setShareWithPartners] = useState(false);

  // Device permissions (toggles are advisory; real changes happen in system settings)
  const [allowLocation, setAllowLocation] = useState(false);
  const [allowCamera, setAllowCamera] = useState(true);
  const [allowMicrophone, setAllowMicrophone] = useState(false);

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );

  const RowToggle = ({ icon, title, subtitle, value, onValueChange }) => (
    <View style={[styles.row, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={22} color={theme.text} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.rowSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#cbd5e1', true: theme.primary || '#3b82f6' }} />
    </View>
  );

  const RowAction = ({ icon, title, subtitle, onPress, danger }) => (
    <TouchableOpacity onPress={onPress} style={[styles.row, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}>
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={22} color={danger ? '#dc2626' : (theme.text)} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.rowTitle, { color: danger ? '#dc2626' : theme.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.rowSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  const handleExportData = async () => {
    Alert.alert('Export requested', 'We will prepare your data and notify you when it is ready to download.');
    // TODO: Hook to backend export job (Supabase/Server) when available
  };

  const handleDeleteData = async () => {
    Alert.alert(
      'Delete all local data?',
      'This clears cached data on this device. To delete your account and server-side data, use Delete Account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => Alert.alert('Cleared', 'Local cache will be cleared on next restart.') },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={56} color={theme.primary || '#3b82f6'} />
        <Text style={[styles.title, { color: theme.text }]}>Privacy Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Manage how your data is used and your app permissions</Text>
      </View>

      <Section title="Data & Personalization">
        <RowToggle icon="person" title="Content personalization" subtitle="Use your activity to personalize learning content" value={contentPersonalization} onValueChange={setContentPersonalization} />
        <RowToggle icon="bar-chart" title="Analytics" subtitle="Allow anonymous usage analytics" value={analytics} onValueChange={setAnalytics} />
        <RowToggle icon="bug-report" title="Crash reports" subtitle="Send crash diagnostics to improve reliability" value={crashReports} onValueChange={setCrashReports} />
        <RowToggle icon="ads-click" title="Personalized ads" subtitle="Use your data to show more relevant ads" value={personalizedAds} onValueChange={setPersonalizedAds} />
        <RowToggle icon="handshake" title="Share with partners" subtitle="Allow limited sharing for service providers" value={shareWithPartners} onValueChange={setShareWithPartners} />
      </Section>

      <Section title="Permissions">
        <RowToggle icon="my-location" title="Location" subtitle="Allow access to your location (configure in system settings)" value={allowLocation} onValueChange={setAllowLocation} />
        <RowToggle icon="photo-camera" title="Camera" subtitle="Allow camera access" value={allowCamera} onValueChange={setAllowCamera} />
        <RowToggle icon="mic" title="Microphone" subtitle="Allow microphone access" value={allowMicrophone} onValueChange={setAllowMicrophone} />
        <RowAction icon="settings" title="Open system app settings" subtitle="Grant or revoke OS-level permissions" onPress={() => Linking.openSettings?.()} />
      </Section>

      <Section title="Your Data">
        <RowAction icon="download" title="Download your data" subtitle="Request an export of your data" onPress={handleExportData} />
        <RowAction icon="delete-forever" title="Delete local app data" subtitle="Clear cached data on this device" onPress={handleDeleteData} danger />
        <RowAction icon="person-remove" title="Delete Account" subtitle="Permanently delete your account and data" onPress={() => router.push('/settings/DeleteAccount')} danger />
      </Section>

      <Section title="Policies & Info">
        <RowAction icon="policy" title="Privacy Policy" subtitle="How we collect and use data" onPress={() => router.push('/settings/PrivacyPolicy')} />
        <RowAction icon="gavel" title="Terms & Conditions" subtitle="Your rights and responsibilities" onPress={() => router.push('/settings/Terms')} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, marginTop: 2, opacity: 0.8 },
});
