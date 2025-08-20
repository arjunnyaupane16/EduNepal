import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function UserManagement() {
  const { users, setUserRole, resetPassword, removeUser, addUser, user } = useAuth();
  const { t } = useLanguage();

  const [query, setQuery] = useState('');

  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  }, [users, query]);

  const onToggleRole = (u) => {
    const next = u.role === 'Administrator' ? 'Student' : 'Administrator';
    if (u.username === 'admin' && next !== 'Administrator') {
      Alert.alert('Not allowed', 'Primary admin role cannot be changed');
      return;
    }
    setUserRole(u.id, next);
  };

  const onResetPassword = (u) => {
    const newPass = Math.random().toString(36).slice(-8);
    resetPassword(u.id, newPass);
    Alert.alert('Password Reset', `New password for ${u.username}: ${newPass}`);
  };

  const onRemove = (u) => {
    Alert.alert(
      'Permanently delete user',
      `This will permanently delete ${u.fullName}'s account and data. This action cannot be undone.`,
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

  const renderItem = ({ item: u }) => (
    <View style={[styles.card, { backgroundColor: '#fff', borderColor: '#e5e7eb' }]}> 
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: '#111827' }]}>{u.fullName}</Text>
          <Text style={[styles.sub, { color: '#6b7280' }]}>{u.email} · @{u.username}</Text>
          <Text style={[styles.sub, { color: '#6b7280' }]}>{u.role} · Joined {u.joinDate}</Text>
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
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>Access denied. Admins only.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#111827' }]}>User Management</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={[styles.searchBox, { borderColor: '#e5e7eb', backgroundColor: '#fff' }]}>
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            style={[styles.searchInput, { color: '#111827' }]}
            placeholder="Search users"
            placeholderTextColor="#9aa0a6"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity style={[styles.addBtn]} onPress={onAddDemoUser}>
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Demo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(u) => u.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  roleText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EEF2F7' },
  pillText: { color: '#1F2937', fontWeight: '700', fontSize: 12 },
  primary: { backgroundColor: '#2563EB' },
  pillPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  danger: { backgroundColor: '#DC2626' },
  pillDangerText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
