import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';
  
  const [stats] = useState({
    totalUsers: 1247,
    activeUsers: 892,
    totalContent: 156,
    newSignups: 23,
    systemHealth: 98.5,
    storageUsed: 67.3
  });

  const QuickStatCard = ({ title, value, icon, color, subtitle }) => (
    <View style={[styles.statCard, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Text style={[styles.statTitle, { color: theme.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text>}
    </View>
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
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>Access denied. Admins only.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>Admin Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Welcome back, {user?.fullName || 'Administrator'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>System Overview</Text>
        
        <View style={styles.statsGrid}>
          <QuickStatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon="people"
            color="#3b82f6"
            subtitle={`+${stats.newSignups} this week`}
          />
          <QuickStatCard
            title="Active Users"
            value={stats.activeUsers.toLocaleString()}
            icon="person-circle"
            color="#22c55e"
            subtitle="Last 24 hours"
          />
          <QuickStatCard
            title="Content Items"
            value={stats.totalContent.toString()}
            icon="library"
            color="#f59e0b"
            subtitle="Books, notes, papers"
          />
          <QuickStatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            icon="pulse"
            color="#ef4444"
            subtitle="All systems operational"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <QuickActionCard
            title="User Management"
            description="Manage student accounts and permissions"
            icon="people-outline"
            color="#3b82f6"
            onPress={() => router.push('/settings/UserManagement')}
          />
          
          <QuickActionCard
            title="Content Management"
            description="Upload and organize educational materials"
            icon="library-outline"
            color="#22c55e"
            onPress={() => router.push('/settings/ContentManagement')}
          />
          
          <QuickActionCard
            title="System Analytics"
            description="View detailed usage statistics and reports"
            icon="analytics-outline"
            color="#f59e0b"
            onPress={() => Alert.alert('Coming Soon', 'Analytics feature will be available soon')}
          />
          
          <QuickActionCard
            title="Notification Center"
            description="Send announcements to all users"
            icon="notifications-outline"
            color="#8b5cf6"
            onPress={() => router.push('/settings/SystemNotifications')}
          />

          <QuickActionCard
            title="System Logs"
            description="View system errors and logs"
            icon="document-text-outline"
            color="#10b981"
            onPress={() => router.push('/settings/SystemLogs')}
          />

          <QuickActionCard
            title="Developer Tools"
            description="Advanced debugging tools"
            icon="code-slash-outline"
            color="#f97316"
            onPress={() => router.push('/settings/DeveloperTools')}
          />
          
          <QuickActionCard
            title="System Settings"
            description="Configure app-wide settings and preferences"
            icon="settings-outline"
            color="#ef4444"
            onPress={() => Alert.alert('Coming Soon', 'System Settings will be available soon')}
          />
          
          <QuickActionCard
            title="Backup & Security"
            description="Manage data backups and security settings"
            icon="shield-outline"
            color="#06b6d4"
            onPress={() => Alert.alert('Coming Soon', 'Backup & Security tools will be available soon')}
          />
        </View>

        <View style={[styles.systemStatus, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}>
          <View style={styles.statusHeader}>
            <Ionicons name="server" size={24} color="#22c55e" />
            <Text style={[styles.statusTitle, { color: theme.text }]}>System Status</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>Server Status</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.statusText, { color: '#22c55e' }]}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>Database</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.statusText, { color: '#22c55e' }]}>Connected</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>Storage Used</Text>
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
