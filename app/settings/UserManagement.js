import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, TextInput, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocalSearchParams } from 'expo-router';
import { useRouter, useFocusEffect } from 'expo-router';
import { getSupabase } from '../services/supabaseClient';
import Constants from 'expo-constants';

export default function UserManagement() {
  const { users, setUserRole, resetPassword, removeUser, addUser, user } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const view = params?.view;
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All'); // All | Administrator | Student
  const [sortBy, setSortBy] = useState('role'); // fixed to role-based sorting
  const [liveUsers, setLiveUsers] = useState(null);
  const [splitByRole, setSplitByRole] = useState(true);
  const subRef = useRef(null);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;

  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';

  const sourceUsers = Array.isArray(liveUsers) && liveUsers.length ? liveUsers : users;
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = Array.isArray(sourceUsers) ? [...sourceUsers] : [];

    // Optional: filter by view param (all | active | online)
    const now = Date.now();
    const activeSince = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const onlineSince = new Date(now - 60 * 1000).toISOString();
    const isAfter = (a, bIso) => {
      const aIso = typeof a === 'string' ? a : '';
      const aMs = Date.parse(aIso) || 0;
      const bMs = Date.parse(bIso) || 0;
      return aMs >= bMs;
    };
    const matchesActivity = (u, sinceIso) => {
      return (
        isAfter(u.last_seen, sinceIso) ||
        isAfter(u.lastSeen, sinceIso) ||
        isAfter(u.last_active, sinceIso) ||
        isAfter(u.lastActive, sinceIso) ||
        isAfter(u.last_login, sinceIso) ||
        isAfter(u.lastLogin, sinceIso)
      );
    };
    const v = String(view || '').toLowerCase();
    if (v === 'active') {
      list = list.filter(u => matchesActivity(u, activeSince));
    } else if (v === 'online') {
      list = list.filter(u => matchesActivity(u, onlineSince));
    }

    // Filter by query
    if (q) {
      list = list.filter(u =>
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    }

    // Filter by role
    if (roleFilter !== 'All') {
      list = list.filter(u => String(u.role || '') === roleFilter);
    }

    // Sort
    if (sortBy === 'name') {
      list.sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
    } else if (sortBy === 'role') {
      list.sort((a, b) => String(a.role || '').localeCompare(String(b.role || '')) || String(a.fullName || '').localeCompare(String(b.fullName || '')));
    } else {
      // recent by joinDate desc (fallback stable)
      list.sort((a, b) => String(b.joinDate || '').localeCompare(String(a.joinDate || '')));
    }

    return list;
  }, [sourceUsers, query, roleFilter, sortBy, view]);

  const roleBuckets = useMemo(() => {
    const admins = data.filter(u => String(u.role || '') === 'Administrator');
    const students = data.filter(u => String(u.role || '') === 'Student');
    return { admins, students };
  }, [data]);

  // Live fetch of users (activity + current route), with realtime subscription and interval refresh
  useFocusEffect(
    React.useCallback(() => {
      const supabase = getSupabase();
      if (!supabase) return;
      let cancelled = false;
      let timer = null;

      const fetchUsers = async () => {
        try {
          let { data, error } = await supabase
            .from('users')
            .select('*');
          if (error) return;
          const mapped = Array.isArray(data) ? data.map(row => row) : [];
          if (!cancelled) setLiveUsers(mapped);
        } catch {}
      };

      fetchUsers();
      timer = setInterval(fetchUsers, 15000);

      // Realtime subscription for immediate updates
      const channel = supabase.channel('users_live_um')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          fetchUsers();
        })
        .subscribe();
      subRef.current = channel;

      return () => {
        cancelled = true;
        if (timer) clearInterval(timer);
        try { supabase.removeChannel(channel); } catch {}
      };
    }, [])
  );

  const onToggleRole = async (u) => {
    const next = u.role === 'Administrator' ? 'Student' : 'Administrator';
    if (u.username === 'admin' && next !== 'Administrator') {
      Alert.alert('Not allowed', 'Primary admin role cannot be changed');
      return;
    }
    // If elevating to Administrator, require email verification
    if (next === 'Administrator') {
      const targetEmail = String(u.email || '').trim();
      if (!targetEmail) {
        Alert.alert('Cannot promote', 'User has no email for verification');
        return;
      }
      const SERVER_URL = Constants?.expoConfig?.extra?.serverUrl || 'http://localhost:4000';
      try {
        const sendRes = await fetch(`${SERVER_URL}/auth/send-code`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, purpose: 'elevate_role' })
        });
        const sendJson = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok || !sendJson?.ok) {
          Alert.alert('Failed to send code', sendJson?.error || 'Server error');
          return;
        }
      } catch (e) {
        Alert.alert('Network error', 'Could not send verification code');
        return;
      }
      // Prompt for code (iOS) with safe fallback (Android/web)
      const doVerify = async (codeText) => {
        const codeInput = String(codeText || '').trim();
        if (!codeInput) return;
        try {
          const verifyRes = await fetch(`${SERVER_URL}/auth/verify-code`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, purpose: 'elevate_role', code: codeInput })
          });
          const verifyJson = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok || !verifyJson?.ok) {
            Alert.alert('Invalid code', verifyJson?.error || 'Could not verify code');
            return;
          }
          setUserRole(u.id, next);
        } catch {
          Alert.alert('Network error', 'Could not verify code');
        }
      };

      Alert.prompt?.(
        'Enter verification code',
        `A code was sent to ${targetEmail}. Enter to confirm making ${u.fullName || '@'+u.username} an Administrator.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: (text) => { doVerify(text); } }
        ],
        'plain-text'
      ) || Alert.alert(
        'Verification sent',
        `A code was sent to ${targetEmail}. Please use a supported device to enter the code, or have support verify manually.`,
        [{ text: 'OK' }]
      );
    } else {
      setUserRole(u.id, next);
    }
  };

  const onResetPassword = (u) => {
    Alert.alert(
      'Reset Password',
      `Are you sure you want to reset the password for ${u.fullName || '@' + u.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const newPass = Math.random().toString(36).slice(-8);
            resetPassword(u.id, newPass);
            Alert.alert('Password Reset', `New password for ${u.username}: ${newPass}`);
          }
        }
      ]
    );
  };

  const onRemove = (u) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${u.fullName}'s account and data? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeUser(u.id) }
      ]
    );
  };

  const onAddDemoUser = () => {
    const ts = Date.now();
    addUser({
      id: `user-${ts}`,
      fullName: `Demo User ${ts % 1000}`,
      email: `demo${ts}@example.com`,
      username: `demo${ts % 1000}`,
      password: 'student123',
      phone: '',
      role: 'Student',
      joinDate: new Date().toISOString().split('T')[0],
      profileImage: null,
    });
  };

  

  // Navigate to per-user detail view
  const onPressUser = (u) => {
    if (!u?.id) return;
    router.push(`/settings/UserDetail?id=${encodeURIComponent(String(u.id))}`);
  };

  // Render each user row
  const renderItem = ({ item: u }) => (
    <TouchableOpacity onPress={() => onPressUser(u)} activeOpacity={0.85} style={styles.card}> 
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{u.fullName}</Text>
          <Text style={[styles.sub, styles.muted]}>{u.email} · @{u.username}</Text>
          <Text style={[styles.sub, styles.muted]}> 
            {u.role} · Joined {u.joinDate}
            {(() => { const r = u.currentRoute || u.current_route; return r ? ` · On ${r}` : ''; })()}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: u.role === 'Administrator' ? '#ef4444' : '#3b82f6' }]}>
          <Text style={styles.roleText}>{u.role}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.pill, styles.primary]} onPress={() => onToggleRole(u)}>
          <Ionicons name="shield-checkmark" size={16} color="#fff" />
          <Text style={styles.pillPrimaryText}>{u.role === 'Administrator' ? 'Make Student' : 'Make Admin'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pill} onPress={() => onResetPassword(u)}>
          <Ionicons name="key" size={16} color="#1F2937" />
          <Text style={styles.pillText}>Reset Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill, styles.danger]} onPress={() => onRemove(u)}>
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.pillDangerText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.denied}>{t('adminAccessDenied')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('userManagement')}</Text>
        <Text style={styles.muted}>{`Total: ${users?.length || 0} • Showing: ${data.length}`}</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users"
            placeholderTextColor="#9aa0a6"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity style={[styles.addBtn]} onPress={() => setSplitByRole(s => !s)}>
          <Ionicons name="git-branch-outline" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{splitByRole ? 'Unified' : 'Split by Role'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addBtn]} onPress={onAddDemoUser}>
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Demo</Text>
        </TouchableOpacity>
        
      </View>

      {/* Filters and sorting */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <TouchableOpacity onPress={() => setRoleFilter('All')} style={[styles.chip, roleFilter === 'All' && styles.chipActive]}>
              <Text style={[styles.chipText, roleFilter === 'All' && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRoleFilter('Administrator')} style={[styles.chip, roleFilter === 'Administrator' && styles.chipActive]}>
              <Text style={[styles.chipText, roleFilter === 'Administrator' && styles.chipTextActive]}>Admins</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRoleFilter('Student')} style={[styles.chip, roleFilter === 'Student' && styles.chipActive]}>
              <Text style={[styles.chipText, roleFilter === 'Student' && styles.chipTextActive]}>Students</Text>
            </TouchableOpacity>
          </View>
          {/* Sort controls removed per request; sorting is fixed to Role */}
        </View>
      </View>

      {data.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Ionicons name="people-circle-outline" size={48} color="#9aa0a6" />
          <Text style={{ color: '#6b7280', marginTop: 8 }}>No users found. Try adjusting filters or search.</Text>
        </View>
      ) : splitByRole ? (
        isSmallScreen ? (
          <SectionList
            sections={[
              { title: 'Administrators', data: roleBuckets.admins },
              { title: 'Students', data: roleBuckets.students },
            ]}
            keyExtractor={(u) => u.id}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={{ fontWeight: '800', color: '#111827', marginBottom: 8, paddingHorizontal: 16, paddingTop: 8 }}>{title}</Text>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          />
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#111827', marginBottom: 8 }}>Administrators</Text>
              <FlatList
                data={roleBuckets.admins}
                keyExtractor={(u) => u.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 24 }}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            </View>
            <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#111827', marginBottom: 8 }}>Students</Text>
              <FlatList
                data={roleBuckets.students}
                keyExtractor={(u) => u.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 24 }}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            </View>
          </View>
        )
      ) : (
        <FlatList
          data={data}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  denied: { color: '#111827', fontSize: 16, fontWeight: '600' },
  muted: { color: '#6b7280', marginTop: 4 },

  // Toolbar
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff' },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Cards & content rows
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  roleText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Action pills
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EEF2F7' },
  pillText: { color: '#1F2937', fontWeight: '700', fontSize: 12 },
  primary: { backgroundColor: '#2563EB' },
  pillPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  danger: { backgroundColor: '#DC2626' },
  pillDangerText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Chips
  chip: { borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { color: '#111827', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
});
