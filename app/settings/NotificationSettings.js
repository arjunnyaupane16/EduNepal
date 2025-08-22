
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotificationsStore } from '../context/NotificationContext';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  applyNotificationsEnabledSideEffects,
  registerForPushNotificationsAsync,
} from '../../utils/notifications';

export default function NotificationSettings() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { getPrefs, updatePrefs, setLocalPrefs } = useNotificationsStore();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [studyReminders, setStudyReminders] = useState(true);
  const [newContent, setNewContent] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [saving, setSaving] = useState(false);

  // Build prefs payload from UI state
  const prefsPayload = useMemo(() => ({
    master_enabled: !!pushNotifications,
    push_enabled: !!pushNotifications,
    email_enabled: !!emailNotifications,
    types: {
      email: !!emailNotifications,
      sms: !!smsAlerts,
      study: !!studyReminders,
      content: !!newContent,
      system: !!systemUpdates,
      marketing: !!marketingEmails,
      weekly_digest: !!weeklyDigest,
    },
  }), [pushNotifications, emailNotifications, smsAlerts, studyReminders, newContent, systemUpdates, marketingEmails, weeklyDigest]);

  // Apply UI from existing prefs
  const applyFromPrefs = (p) => {
    if (!p) return;
    // prefer push_enabled if present, fallback to master_enabled
    setPushNotifications(typeof p.push_enabled !== 'undefined' ? !!p.push_enabled : (p.master_enabled !== false));
    const types = p.types || {};
    if (typeof p.email_enabled !== 'undefined') setEmailNotifications(!!p.email_enabled);
    else if (typeof types.email !== 'undefined') setEmailNotifications(!!types.email);
    if (typeof types.sms !== 'undefined') setSmsAlerts(!!types.sms);
    if (typeof types.study !== 'undefined') setStudyReminders(!!types.study);
    if (typeof types.content !== 'undefined') setNewContent(!!types.content);
    if (typeof types.system !== 'undefined') setSystemUpdates(!!types.system);
    if (typeof types.marketing !== 'undefined') setMarketingEmails(!!types.marketing);
    if (typeof types.weekly_digest !== 'undefined') setWeeklyDigest(!!types.weekly_digest);
  };

  // Load prefs on mount/user change
  useEffect(() => {
    if (!user?.id) return;
    const existing = getPrefs(user.id);
    if (existing) {
      applyFromPrefs(existing);
      return;
    }
    // If not cached, rely on NotificationContext initial loader; fallback to defaults
  }, [user?.id]);

  // Sync master push toggle with global notifications flag (device-level)
  useEffect(() => {
    (async () => {
      try {
        const enabled = await getNotificationsEnabled();
        setPushNotifications(prev => typeof prev === 'boolean' ? enabled : enabled);
      } catch {}
    })();
  }, []);

  // Realtime: propagate local prefs instantly so gating applies without pressing Save
  useEffect(() => {
    if (!user?.id) return;
    try { setLocalPrefs(user.id, prefsPayload); } catch {}
  }, [user?.id, prefsPayload]);

  const handleSaveSettings = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Optimistic local update for realtime gating
      setLocalPrefs(user.id, prefsPayload);
      const { error } = await updatePrefs(user.id, prefsPayload);
      if (error) {
        Alert.alert(t('error'), t('failedToSaveSettings'));
      } else {
        Alert.alert(t('success'), t('notifSettingsSaved'));
      }
    } finally { setSaving(false); }
  };

  const NotificationItem = ({ title, description, value, onValueChange, icon }) => (
    <View style={[styles.notificationItem, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Ionicons name={icon} size={20} color={theme.text} />
          <Text style={[styles.notificationTitle, { color: theme.text }]}>{title}</Text>
        </View>
        {description && (
          <Text style={[styles.notificationDescription, { color: theme.secondaryText }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#3b82f6' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>{t('notificationSettingsTitle')}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          {t('notificationSettingsSubtitle')}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('pushNotifications')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.secondaryText }]}>
            {t('pushNotificationsDesc')}
          </Text>
          
          <NotificationItem
            title={t('pushNotifications')}
            description={t('pushNotificationsDesc')}
            value={pushNotifications}
            onValueChange={async (v) => {
              try {
                setPushNotifications(v);
                // Update device/global flag immediately
                await setNotificationsEnabled(v);
                await applyNotificationsEnabledSideEffects(v);
                if (v) {
                  // Ensure device has a registered push token
                  await registerForPushNotificationsAsync();
                }
              } catch {}
            }}
            icon="phone-portrait-outline"
          />
          
          <NotificationItem
            title={t('studyReminders')}
            description={t('studyRemindersDesc')}
            value={studyReminders}
            onValueChange={(v) => setStudyReminders(v)}
            icon="time-outline"
          />
          
          <NotificationItem
            title={t('newContentAvailable')}
            description={t('newContentAvailableDesc')}
            value={newContent}
            onValueChange={(v) => setNewContent(v)}
            icon="library-outline"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('emailNotificationsSection')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.secondaryText }]}>
            {t('emailNotificationsDesc')}
          </Text>
          
          <NotificationItem
            title={t('emailNotifications')}
            description={t('emailNotificationsDesc')}
            value={emailNotifications}
            onValueChange={(v) => setEmailNotifications(v)}
            icon="mail-outline"
          />
          
          <NotificationItem
            title={t('weeklyDigest')}
            description={t('weeklyDigestDesc')}
            value={weeklyDigest}
            onValueChange={(v) => setWeeklyDigest(v)}
            icon="calendar-outline"
          />
          
          <NotificationItem
            title={t('marketingEmails')}
            description={t('marketingEmailsDesc')}
            value={marketingEmails}
            onValueChange={(v) => setMarketingEmails(v)}
            icon="megaphone-outline"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('systemSecuritySection')}</Text>
          <Text style={[styles.sectionDescription, { color: theme.secondaryText }]}>
            {t('systemSecuritySectionDesc')}
          </Text>
          
          <NotificationItem
            title={t('smsAlerts')}
            description={t('smsAlertsDesc')}
            value={smsAlerts}
            onValueChange={(v) => setSmsAlerts(v)}
            icon="chatbox-outline"
          />
          
          <NotificationItem
            title={t('systemUpdates')}
            description={t('systemUpdatesDesc')}
            value={systemUpdates}
            onValueChange={(v) => setSystemUpdates(v)}
            icon="settings-outline"
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }]}>
          <Ionicons name="information-circle" size={20} color="#0ea5e9" />
          <Text style={[styles.infoText, { color: '#0c4a6e' }]}>
            {t('infoChangeAnytime')}
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings} disabled={saving} accessibilityRole="button" accessibilityLabel={t('saveNotificationSettings')}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>{saving ? t('saving') : t('saveNotificationSettings')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 15,
    opacity: 0.8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
    marginRight: 15,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  notificationDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 30,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
