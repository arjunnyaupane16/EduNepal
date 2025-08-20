import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotificationsStore } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getForUser, clearForUser, markRead, markUnread, markAllRead, markAllUnread } = useNotificationsStore();
  const items = useMemo(() => (user ? getForUser(user.id) : []), [user?.id, getForUser]);

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('notifications')}</Text>
        {items.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => markAllRead(user.id)} style={styles.headerPillPrimary}>
              <Text style={styles.headerPillPrimaryText}>{t('markAllAsRead')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => markAllUnread(user.id)} style={styles.headerPill}>
              <Text style={styles.headerPillText}>{t('markAllAsUnread')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => clearForUser(user.id)}>
              <Text style={styles.clearAll}>{t('clearAll')}</Text>
            </TouchableOpacity>
          </View>
        )}
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
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }] }>
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
                  <View style={styles.actionsRow}>
                    {item.read ? (
                      <TouchableOpacity onPress={() => markUnread(user.id, item.id)} style={styles.actionPill}>
                        <Text style={styles.actionText}>{t('markAsUnread')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => markRead(user.id, item.id)} style={styles.actionPillPrimary}>
                        <Text style={styles.actionTextPrimary}>{t('markAsRead')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
        />
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
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#EEF2F7' },
  actionText: { color: '#1F2937', fontWeight: '600', fontSize: 12 },
  actionPillPrimary: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#2563EB' },
  actionTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
