import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotificationsStore } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from 'expo-router';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getForUser, clearForUser, markAllRead, markAllUnread, refreshForUser, loadMoreForUser, markRead, markUnread } = useNotificationsStore();
  const navigation = useNavigation();
  const items = useMemo(() => (user ? getForUser(user.id) : []), [user?.id, getForUser]);
  const allRead = useMemo(() => items.length > 0 && items.every(n => n.read), [items]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const endReachedGuard = useRef(false);

  useEffect(() => {
    // Initial fetch of admin-sent notifications
    if (!user?.id) return;
    refreshForUser(user.id);
  }, [user?.id, refreshForUser]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try { await refreshForUser(user.id); } finally { setRefreshing(false); }
  }, [user?.id, refreshForUser]);

  const onEndReached = useCallback(async () => {
    if (!user?.id || loadingMore || endReachedGuard.current) return;
    endReachedGuard.current = true;
    setLoadingMore(true);
    try { await loadMoreForUser(user.id); } finally { setLoadingMore(false); setTimeout(() => { endReachedGuard.current = false; }, 500); }
  }, [user?.id, loadMoreForUser, loadingMore]);

  // Clean up selection if items list changes (remove ids that no longer exist)
  useEffect(() => {
    if (!items?.length && selected.size) {
      setSelected(new Set());
      return;
    }
    if (selected.size) {
      const valid = new Set(items.map(i => i.id));
      const next = new Set(Array.from(selected).filter(id => valid.has(id)));
      if (next.size !== selected.size) setSelected(next);
    }
  }, [items]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const markSelected = useCallback((read) => {
    if (!user?.id || selected.size === 0) return;
    const ids = Array.from(selected);
    ids.forEach(id => {
      if (read) {
        markRead(user.id, id);
      } else {
        markUnread(user.id, id);
      }
    });
    clearSelection();
  }, [selected, user?.id, markRead, markUnread, clearSelection]);

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{t('login')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }] }>
      <View style={[styles.header, { borderColor: theme.border }]}> 
        <TouchableOpacity onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate('(authenticated)'))} style={styles.headerBack}>
          <Ionicons name  ="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('notifications')}</Text>
        <TouchableOpacity
          onPress={() => {
            // Try to navigate to NotificationSettings; fallback to Profile if route not found
            try { navigation.navigate('settings/NotificationSettings'); }
            catch { try { navigation.navigate('settings'); } catch { navigation.navigate('(authenticated)'); } }
          }}
          style={styles.headerBack}
        >
          <Ionicons name="settings-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-off-outline" size={36} color="#9aa0a6" />
          <Text style={styles.emptyText}>{t('noNotificationsYet')}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          data={items}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReachedThreshold={0.3}
          onEndReached={onEndReached}
          ListFooterComponent={loadingMore ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator color={theme.primary || '#2563EB'} />
            </View>
          ) : null}
          renderItem={({ item }) => {
            const isSelected = selected.has(item.id);
            const onPress = () => {
              if (selected.size > 0) {
                toggleSelect(item.id);
              } else {
                if (!user?.id) return;
                if (item.read) markUnread(user.id, item.id); else markRead(user.id, item.id);
              }
            };
            const onLongPress = () => toggleSelect(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                onLongPress={onLongPress}
              >
                <View style={[
                  styles.card,
                  { backgroundColor: theme.card, shadowColor: theme.shadow, borderWidth: isSelected ? 2 : 0, borderColor: isSelected ? (theme.primary || '#2563EB') : 'transparent' }
                ] }>
                  <View style={styles.cardRow}>
                    <View style={styles.iconWrap}>
                      <Ionicons name={item.read ? 'notifications-outline' : 'notifications'} size={20} color={item.read ? '#9aa0a6' : '#4285F4'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!item.read && <View style={styles.unreadDot} />}
                        <Text style={[styles.title, { color: theme.text, fontWeight: item.read ? '600' : '800' }]} numberOfLines={2}>{item.title}</Text>
                      </View>
                      {item.body ? (
                        <Text style={[styles.body, item.read ? { color: '#666' } : null]} numberOfLines={3}>{item.body}</Text>
                      ) : null}
                      {item.date ? (
                        <View style={styles.metaRow}>
                          <Ionicons name="time-outline" size={14} color="#9aa0a6" />
                          <Text style={styles.metaText}>{new Date(item.date).toLocaleString()}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {selected.size > 0 ? (
        <View style={[styles.footerActions, { borderColor: theme.border, backgroundColor: theme.cardBackground || '#fff' }]}> 
          <TouchableOpacity onPress={() => markSelected(true)} style={[styles.footerBtn, { backgroundColor: '#2563EB' }]}>
            <Text style={[styles.footerBtnText, { color: '#fff' }]}>{t('markAsRead') || 'Mark Read'} ({selected.size})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => markSelected(false)} style={[styles.footerBtn, { backgroundColor: '#EEF2F7' }]}>
            <Text style={[styles.footerBtnText, { color: '#1F2937' }]}>{t('markAsUnread') || 'Mark Unread'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearSelection} style={[styles.footerBtn, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.footerBtnText, { color: '#B91C1C' }]}>{t('clearSelection') || 'Clear Selection'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        items.length > 0 && (
          <View style={[styles.footerActions, { borderColor: theme.border, backgroundColor: theme.cardBackground || '#fff' }]}> 
            <TouchableOpacity
              onPress={() => (allRead ? markAllUnread(user.id) : markAllRead(user.id))}
              style={[styles.footerBtn, { backgroundColor: allRead ? '#EEF2F7' : '#2563EB' }]}
            >
              <Text style={[styles.footerBtnText, { color: allRead ? '#1F2937' : '#fff' }]}> 
                {allRead ? t('markAllAsUnread') : t('markAllAsRead')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              Alert.alert(t('clearAll'), t('confirm'), [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                { text: t('clearAll') || 'Clear All', style: 'destructive', onPress: () => clearForUser(user.id) },
              ]);
            }} style={[styles.footerBtn, { backgroundColor: '#FEE2E2' }]}> 
              <Text style={[styles.footerBtnText, { color: '#B91C1C' }]}>{t('clearAll')}</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  clearAll: { color: '#e53935', fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#EEF2F7' },
  headerPillText: { color: '#1F2937', fontWeight: '600', fontSize: 12 },
  headerPillPrimary: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#2563EB' },
  headerPillPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  footerActions: { flexDirection: 'row', gap: 12, padding: 12, borderTopWidth: 1 },
  footerBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  footerBtnText: { fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 8, color: '#9aa0a6' },
  card: {
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e53935', marginRight: 6, marginTop: 8 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
    marginTop: 2,
  },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  body: { color: '#444' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaText: { color: '#9aa0a6', fontSize: 12 },
  /* per-item action styles removed */
});
