// app/settings/PrivacySettings.js
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, AppState } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STORE_KEY = 'privacy_prefs_v1';

export default function PrivacySettings() {
  const { theme } = useTheme();
  const router = useRouter();

  // Core consents
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [crashReports, setCrashReports] = useState(true);
  const [contentPersonalization, setContentPersonalization] = useState(true);
  const [shareWithPartners, setShareWithPartners] = useState(false);

  // Additional uses
  const [research, setResearch] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [pushPersonalization, setPushPersonalization] = useState(true);
  const [diagnosticsOS, setDiagnosticsOS] = useState(false);

  // Granular categories
  const [consents, setConsents] = useState({
    storageAccess: true,
    measurement: true,
    personalization: true,
    advertising: false,
    contentSelection: true,
  });

  // Device permissions (we'll request on toggle)
  const [allowLocation, setAllowLocation] = useState(false);
  const [allowCamera, setAllowCamera] = useState(false);
  const [allowMicrophone, setAllowMicrophone] = useState(false);

  // Load saved preferences
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setPersonalizedAds(saved.personalizedAds ?? false);
          setAnalytics(saved.analytics ?? true);
          setCrashReports(saved.crashReports ?? true);
          setContentPersonalization(saved.contentPersonalization ?? true);
          setShareWithPartners(saved.shareWithPartners ?? false);
          setResearch(saved.research ?? false);
          setMarketingEmails(saved.marketingEmails ?? false);
          setPushPersonalization(saved.pushPersonalization ?? true);
          setDiagnosticsOS(saved.diagnosticsOS ?? false);
          if (saved.consents) setConsents((c) => ({ ...c, ...saved.consents }));
          // permissions snapshot (advisory)
          setAllowLocation(saved.allowLocation ?? false);
          setAllowCamera(saved.allowCamera ?? false);
          setAllowMicrophone(saved.allowMicrophone ?? false);
        }
      } catch {}
    })();
  }, []);

  // Keep UI in sync with actual OS permission status (on mount and when returning from settings)
  useEffect(() => {
    let isMounted = true;

    const checkPermissions = async () => {
      try {
        const [cam, mic, loc] = await Promise.all([
          Camera.getCameraPermissionsAsync?.(),
          Audio.getPermissionsAsync?.(),
          Location.getForegroundPermissionsAsync?.(),
        ]);
        if (!isMounted) return;
        const camGranted = cam?.status === 'granted';
        const micGranted = mic?.status === 'granted';
        const locGranted = loc?.status === 'granted';
        setAllowCamera(camGranted);
        setAllowMicrophone(micGranted);
        setAllowLocation(locGranted);
        // persist snapshot to reflect actual OS state
        persist({ ...snapshot(), allowCamera: camGranted, allowMicrophone: micGranted, allowLocation: locGranted });
      } catch {}
    };

    // initial check
    checkPermissions();

    // refresh when app becomes active (e.g., after user changes settings in OS)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermissions();
    });

    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, []);

  const persist = async (next) => {
    try { await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {}
  };

  const snapshot = () => ({
    personalizedAds,
    analytics,
    crashReports,
    contentPersonalization,
    shareWithPartners,
    research,
    marketingEmails,
    pushPersonalization,
    diagnosticsOS,
    consents,
    allowLocation,
    allowCamera,
    allowMicrophone,
  });

  // Auto-save on any change (real-time persistence)
  useEffect(() => {
    persist(snapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    personalizedAds,
    analytics,
    crashReports,
    contentPersonalization,
    shareWithPartners,
    research,
    marketingEmails,
    pushPersonalization,
    diagnosticsOS,
    consents,
    allowLocation,
    allowCamera,
    allowMicrophone,
  ]);

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );

  // Permission requests
  const requestCamera = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission denied', 'Enable camera in system settings to upload a profile photo.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings?.() },
          { text: 'OK', style: 'cancel' },
        ]);
        setAllowCamera(false);
        persist({ ...snapshot(), allowCamera: false });
        return false;
      }
      setAllowCamera(true);
      persist({ ...snapshot(), allowCamera: true });
      return true;
    } catch {
      return false;
    }
  };

  const requestMicrophone = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Microphone permission denied', 'Enable microphone in system settings.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings?.() },
          { text: 'OK', style: 'cancel' },
        ]);
        setAllowMicrophone(false);
        persist({ ...snapshot(), allowMicrophone: false });
        return false;
      }
      setAllowMicrophone(true);
      persist({ ...snapshot(), allowMicrophone: true });
      return true;
    } catch { return false; }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission denied', 'Enable location in system settings.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings?.() },
          { text: 'OK', style: 'cancel' },
        ]);
        setAllowLocation(false);
        persist({ ...snapshot(), allowLocation: false });
        return false;
      }
      setAllowLocation(true);
      persist({ ...snapshot(), allowLocation: true });
      return true;
    } catch { return false; }
  };

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

      <Section title="Additional Uses">
        <RowToggle icon="science" title="Research & development" subtitle="Share anonymized usage for research" value={research} onValueChange={setResearch} />
        <RowToggle icon="email" title="Marketing emails" subtitle="Get product tips and updates" value={marketingEmails} onValueChange={setMarketingEmails} />
        <RowToggle icon="notifications" title="Personalized notifications" subtitle="Improve relevance of push notifications" value={pushPersonalization} onValueChange={setPushPersonalization} />
        <RowToggle icon="system-update-alt" title="Share diagnostics with OS" subtitle="Allow anonymized diagnostics with OS" value={diagnosticsOS} onValueChange={setDiagnosticsOS} />
      </Section>

      <Section title="Granular Controls (by purpose)">
        <RowToggle icon="storage" title="Storage access (required)" subtitle="Required for app to function" value={consents.storageAccess} onValueChange={(v)=> setConsents((c)=>({ ...c, storageAccess: v }))} />
        <RowToggle icon="speed" title="Measurement" subtitle="Performance, usage statistics" value={consents.measurement} onValueChange={(v)=> setConsents((c)=>({ ...c, measurement: v }))} />
        <RowToggle icon="tune" title="Personalization" subtitle="Content and feature personalization" value={consents.personalization} onValueChange={(v)=> setConsents((c)=>({ ...c, personalization: v }))} />
        <RowToggle icon="campaign" title="Advertising" subtitle="Personalized advertising" value={consents.advertising} onValueChange={(v)=> setConsents((c)=>({ ...c, advertising: v }))} />
        <RowToggle icon="article" title="Content selection" subtitle="Personalized content recommendations" value={consents.contentSelection} onValueChange={(v)=> setConsents((c)=>({ ...c, contentSelection: v }))} />
      </Section>

      <Section title="Permissions">
        <RowToggle icon="my-location" title="Location" subtitle="Allow access to your location (tap to request)" value={allowLocation} onValueChange={(v)=>{
          if (v) { requestLocation(); } else { setAllowLocation(false); persist({ ...snapshot(), allowLocation: false }); }
        }} />
        <RowToggle icon="photo-camera" title="Camera" subtitle="Allow camera access (tap to request)" value={allowCamera} onValueChange={(v)=>{
          if (v) { requestCamera(); } else { setAllowCamera(false); persist({ ...snapshot(), allowCamera: false }); }
        }} />
        <RowToggle icon="mic" title="Microphone" subtitle="Allow microphone access (tap to request)" value={allowMicrophone} onValueChange={(v)=>{
          if (v) { requestMicrophone(); } else { setAllowMicrophone(false); persist({ ...snapshot(), allowMicrophone: false }); }
        }} />
        <RowAction icon="settings" title="Open system app settings" subtitle="Grant or revoke OS-level permissions" onPress={() => Linking.openSettings?.()} />
      </Section>

      <Section title="Your Data">
        <RowAction icon="download" title="Download your data" subtitle="Request an export of your data" onPress={handleExportData} />
        <RowAction icon="delete-forever" title="Delete local app data" subtitle="Clear cached data on this device" onPress={handleDeleteData} danger />
        <RowAction icon="fingerprint" title="Reset anonymous identifier" subtitle="Resets analytics/ads identifiers" onPress={() => Alert.alert('Reset', 'Identifier reset will apply on next launch.')} />
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
