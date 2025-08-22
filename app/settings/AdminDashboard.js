import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { getSupabase } from '../services/supabaseClient';
import Constants from 'expo-constants';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    onlineUsers: 0,
    totalContent: 0,
    newSignups: 0,
    systemHealth: 100,
    storageUsed: 0,
  });
  const [serverOnline, setServerOnline] = useState(false);
  const [dbOnline, setDbOnline] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    let isMounted = true;

    const fetchCounts = async () => {
      try {
        // Users count
        const usersRes = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        const totalUsers = usersRes?.count ?? 0;

        // Content count
        const contentRes = await supabase
          .from('content')
          .select('*', { count: 'exact', head: true });
        const totalContent = contentRes?.count ?? 0;

        // New signups in last 7 days (try created_at, then createdAt)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        let newSignups = 0;
        try {
          const recent1 = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo);
          newSignups = recent1?.count ?? 0;
        } catch {}
        if (newSignups === 0) {
          try {
            const recent2 = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .gte('createdAt', sevenDaysAgo);
            newSignups = recent2?.count ?? 0;
          } catch {}
        }

        // Active users in last 24 hours (try multiple column names)
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        let activeUsers = 0;
        const activityColumns = ['last_seen', 'lastSeen', 'last_active', 'lastActive', 'last_login', 'lastLogin'];
        for (const col of activityColumns) {
          try {
            const res = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .gte(col, since);
            if (typeof res?.count === 'number') { activeUsers = res.count; break; }
          } catch {}
        }

        if (isMounted) {
          setStats(prev => ({
            ...prev,
            totalUsers,
            totalContent,
            newSignups,
            activeUsers,
          }));
          setDbOnline(true);
        }
      } catch (e) {
        // Silent fail to keep UI responsive
        if (isMounted) setDbOnline(false);
      }
    };

    // Initial fetch
    fetchCounts();

    // Realtime subscription: re-fetch counts on any change in users or content
    const channel = supabase
      .channel('admin_dashboard_overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      isMounted = false;
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  // Live online users (active within last 60 seconds), polled every 10s
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;
    let timer = null;
    const activityColumns = ['last_seen', 'lastSeen', 'last_active', 'lastActive', 'last_login', 'lastLogin'];

    const refreshOnline = async () => {
      try {
        const since60s = new Date(Date.now() - 60 * 1000).toISOString();
        let onlineUsers = 0;
        for (const col of activityColumns) {
          try {
            const res = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .gte(col, since60s);
            if (typeof res?.count === 'number') { onlineUsers = res.count; break; }
          } catch {}
        }
        if (!cancelled) setStats(prev => ({ ...prev, onlineUsers }));
      } catch {}
      if (!cancelled) timer = setTimeout(refreshOnline, 10000);
    };

    refreshOnline();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  // Poll server health every 5s
  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_SERVER_URL || Constants?.expoConfig?.extra?.serverUrl || '';
    if (!url) return;
    let cancelled = false;
    let timer = null;

    const check = async () => {
      try {
        const res = await fetch(`${url}/health`, { method: 'GET' });
        const ok = res.ok;
        if (!cancelled) setServerOnline(!!ok);
      } catch (e) {
        if (!cancelled) setServerOnline(false);
      } finally {
        if (!cancelled) timer = setTimeout(check, 5000);
      }
    };
    check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  // Notification setup panel removed; status now lives inside SystemNotifications

  const QuickStatCard = ({ title, value, icon, color, subtitle, onPress }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.statCard, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}
    > 
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Text style={[styles.statTitle, { color: theme.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.actionCard, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.actionDescription, { color: theme.secondaryText }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{t('adminAccessDenied')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>{t('adminDashboardTitle')}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          {`${t('adminWelcomeBack')} ${user?.fullName || t('roleAdministrator')}`}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('systemOverview')}</Text>
        
        <View style={styles.statsGrid}>
          <QuickStatCard
            title={t('totalUsers')}
            value={stats.totalUsers.toLocaleString()}
            icon="people"
            color="#3b82f6"
            subtitle={`+${stats.newSignups}`}
            onPress={() => router.push('/settings/UserManagement?view=all')}
          />
          <QuickStatCard
            title={t('activeUsers')}
            value={stats.activeUsers.toLocaleString()}
            icon="person-circle"
            color="#22c55e"
            subtitle={t('last24Hours')}
            onPress={() => router.push('/settings/UserManagement?view=active')}
          />
          <QuickStatCard
            title={t('onlineUsers')}
            value={stats.onlineUsers.toLocaleString()}
            icon="wifi"
            color="#06b6d4"
            subtitle={t('live')}
            onPress={() => router.push('/settings/UserManagement?view=online')}
          />
          <QuickStatCard
            title={t('contentItems')}
            value={stats.totalContent.toString()}
            icon="library"
            color="#f59e0b"
            subtitle={t('booksNotesPapers')}
            onPress={() => router.push('/settings/ContentManagement')}
          />
          <QuickStatCard
            title={t('systemHealth')}
            value={`${stats.systemHealth}%`}
            icon="pulse"
            color="#ef4444"
            subtitle={undefined}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('quickActions')}</Text>

        {/* Notification setup banner removed */}
        
        <View style={styles.actionsContainer}>
          <QuickActionCard
            title={t('userManagement')}
            description={t('userManagementDesc')}
            icon="people-outline"
            color="#3b82f6"
            onPress={() => router.push('/settings/UserManagement')}
          />
          
          <QuickActionCard
            title={t('contentManagement')}
            description={t('contentManagementDesc')}
            icon="library-outline"
            color="#22c55e"
            onPress={() => router.push('/settings/ContentManagement')}
          />
          
          <QuickActionCard
            title={t('systemAnalytics')}
            description={t('systemAnalyticsDesc')}
            icon="analytics-outline"
            color="#f59e0b"
            onPress={() => Alert.alert(t('comingSoon'), 'Analytics feature will be available soon')}
          />
          
          <QuickActionCard
            title={t('notificationCenter')}
            description={t('notificationCenterDesc')}
            icon="notifications-outline"
            color="#8b5cf6"
            onPress={() => router.push('/settings/SystemNotifications')}
          />

          <QuickActionCard
            title={t('systemLogs')}
            description="View system errors and logs"
            icon="document-text-outline"
            color="#10b981"
            onPress={() => router.push('/settings/SystemLogs')}
          />

          <QuickActionCard
            title={t('developerTools')}
            description="Advanced debugging tools"
            icon="code-slash-outline"
            color="#f97316"
            onPress={() => router.push('/settings/DeveloperTools')}
          />
          
          <QuickActionCard
            title={t('systemSettings')}
            description={t('systemSettingsDesc')}
            icon="settings-outline"
            color="#ef4444"
            onPress={() => Alert.alert(t('comingSoon'), 'System Settings will be available soon')}
          />
          
          <QuickActionCard
            title={t('backupSecurity')}
            description={t('backupSecurityDesc')}
            icon="shield-outline"
            color="#06b6d4"
            onPress={() => Alert.alert(t('comingSoon'), 'Backup & Security tools will be available soon')}
          />
        </View>

        <View style={[styles.systemStatus, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}> 
          <View style={styles.statusHeader}>
            <Ionicons name="server" size={24} color="#22c55e" />
            <Text style={[styles.statusTitle, { color: theme.text }]}>{t('systemStatus')}</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>{t('serverStatus')}</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: serverOnline ? '#22c55e' : '#ef4444' }]} />
              <Text style={[styles.statusText, { color: serverOnline ? '#22c55e' : '#ef4444' }]}>{serverOnline ? t('online') : t('offline')}</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>{t('database')}</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: dbOnline ? '#22c55e' : '#ef4444' }]} />
              <Text style={[styles.statusText, { color: dbOnline ? '#22c55e' : '#ef4444' }]}>{dbOnline ? t('connected') : t('disconnected')}</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>{t('storageUsed')}</Text>
            <Text style={[styles.statusValue, { color: theme.text }]}>{stats.storageUsed}%</Text>
          </View>
        </View>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
  systemStatus: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
