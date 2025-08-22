import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../services/supabaseClient';
import Constants from 'expo-constants';
import { useLanguage } from '../context/LanguageContext';

export default function UserDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { users, setUserRole, resetPassword, removeUser, user: me } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [u, setU] = useState(null);

  const isAdmin = me?.role === 'Administrator' || me?.username === 'admin';

  const load = useCallback(async () => {
    const supabase = getSupabase();
    setLoading(true);
    try {
      let found = users.find(x => String(x.id) === String(id));
      if (!found && supabase) {
        const { data } = await supabase.from('users').select('*').eq('id', id).limit(1).maybeSingle();
        if (data) found = data;
      }
      setU(found || null);
    } catch {
      setU(null);
    } finally {
      setLoading(false);
    }
  }, [id, users]);

  useEffect(() => { load(); }, [load]);

  const onResetPassword = () => {
    if (!u) return;
    Alert.alert(
      'Reset Password',
      `Are you sure you want to reset password for ${u.fullName || '@' + u.username}?`,
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

  const onRemove = () => {
    if (!u) return;
    Alert.alert(
      'Permanently delete user',
      `This will permanently delete ${u.fullName}'s account and data. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await removeUser(u.id); router.back(); } }
      ]
    );
  };

  const onToggleRole = () => {
    if (!u) return;
    const next = u.role === 'Administrator' ? 'Student' : 'Administrator';
    if (u.username === 'admin' && next !== 'Administrator') {
      Alert.alert('Not allowed', 'Primary admin role cannot be changed');
      return;
    }
    if (next === 'Administrator') {
      const targetEmail = String(u.email || '').trim();
      if (!targetEmail) {
        Alert.alert('Cannot promote', 'User has no email for verification');
        return;
      }
      const SERVER_URL = Constants?.expoConfig?.extra?.serverUrl || 'http://localhost:4000';
      fetch(`${SERVER_URL}/auth/send-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, purpose: 'elevate_role' })
      }).then(async (res) => {
        const js = await res.json().catch(() => ({}));
        if (!res.ok || !js?.ok) {
          Alert.alert('Failed to send code', js?.error || 'Server error');
          return;
        }
        // Fallback code entry using simple prompt info (if platform lacks Alert.prompt, instruct to enter code via next alert)
        Alert.prompt?.(
          'Enter verification code',
          `A code was sent to ${targetEmail}. Enter to confirm.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: async (codeText) => { await verifyAndPromote(codeText); } }
          ],
          'plain-text'
        ) || Alert.alert(
          'Check Email',
          `A code was sent to ${targetEmail}. Please go back after verifying via server, or contact support.`,
          [{ text: 'OK' }]
        );
      }).catch(() => Alert.alert('Network error', 'Could not send verification code'));
    } else {
      setUserRole(u.id, next);
    }
  };

  const verifyAndPromote = async (codeText) => {
    const code = String(codeText || '').trim();
    if (!code) return;
    const targetEmail = String(u?.email || '').trim();
    const SERVER_URL = Constants?.expoConfig?.extra?.serverUrl || 'http://localhost:4000';
    try {
      const res = await fetch(`${SERVER_URL}/auth/verify-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, purpose: 'elevate_role', code })
      });
      const js = await res.json().catch(() => ({}));
      if (!res.ok || !js?.ok) {
        Alert.alert('Invalid code', js?.error || 'Could not verify code');
        return;
      }
      setUserRole(u.id, 'Administrator');
    } catch {
      Alert.alert('Network error', 'Could not verify code');
    }
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{t('adminAccessDenied')}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>{t('loading')}</Text>
      </View>
    );
  }

  if (!u) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text>User not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f9fafb' }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#111827' }]}>User Detail</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={[styles.card, { backgroundColor: '#fff', borderColor: '#e5e7eb' }]}> 
          <Text style={[styles.name, { color: '#111827' }]}>{u.fullName}</Text>
          <Text style={[styles.sub, { color: '#6b7280' }]}>{u.email} · @{u.username}</Text>
          <Text style={[styles.sub, { color: '#6b7280' }]}>
            {u.role} · Joined {u.joinDate}
          </Text>
          <Text style={[styles.sub, { color: '#6b7280', marginTop: 2 }]}>
            Current page: {u.currentRoute || u.current_route || '—'}
          </Text>
          <Text style={[styles.sub, { color: '#6b7280', marginTop: 2 }]}>Last seen: {u.lastSeen || u.last_seen || '—'}</Text>
          <Text style={[styles.sub, { color: '#6b7280', marginTop: 2 }]}>Last active: {u.lastActive || u.last_active || '—'}</Text>
          <Text style={[styles.sub, { color: '#6b7280', marginTop: 2 }]}>Last login: {u.lastLogin || u.last_login || '—'}</Text>

          <View style={[styles.actions, { marginTop: 12 }]}>
            <TouchableOpacity style={[styles.pill, styles.primary]} onPress={onToggleRole}>
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
              <Text style={styles.pillPrimaryText}>{u.role === 'Administrator' ? 'Make Student' : 'Make Admin'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={onResetPassword}>
              <Ionicons name="key" size={16} color="#1F2937" />
              <Text style={styles.pillText}>Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, styles.danger]} onPress={onRemove}>
              <Ionicons name="trash" size={16} color="#fff" />
              <Text style={styles.pillDangerText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 14, paddingBottom: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', marginLeft: 4 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12 },
  name: { fontSize: 18, fontWeight: '700' },
  sub: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EEF2F7' },
  pillText: { color: '#1F2937', fontWeight: '700', fontSize: 12 },
  primary: { backgroundColor: '#2563EB' },
  pillPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  danger: { backgroundColor: '#DC2626' },
  pillDangerText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
