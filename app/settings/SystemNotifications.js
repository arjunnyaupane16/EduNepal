 import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getServerUrl, saveServerUrl, scheduleLocalRandomNotification, getNotificationsEnabled } from '../../utils/notifications';
import { getSupabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SystemNotifications() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('EduNepal');
  const [message, setMessage] = useState('Study reminder: Open EduNepal today!');
  const [loading, setLoading] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [stats, setStats] = useState({ tokens: 0, emails: 0, dailyTime: null });
  const [history, setHistory] = useState([]);
  const [notifHistory, setNotifHistory] = useState([]); // Supabase notifications list
  const [refreshing, setRefreshing] = useState(false);
  const [serverOk, setServerOk] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [selectedNotifs, setSelectedNotifs] = useState(new Set());
  // Time filter & calendar
  const [timeFilter, setTimeFilter] = useState('month'); // 'day' | 'week' | 'month' | 'year' | 'custom'
  const [selectedDate, setSelectedDate] = useState(new Date()); // used for 'day'
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // Dev: runtime server URL override
  const [serverUrl, setServerUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  // Admin in-app (Supabase) notification
  const [audience, setAudience] = useState('all'); // e.g., 'all' | 'user:<id>' | 'segment:<id>'
  const [category, setCategory] = useState('system'); // 'study' | 'content' | 'system' | 'marketing'
  const [sendingInApp, setSendingInApp] = useState(false);

  const isAdmin = user?.role === 'Administrator' || ['admin', '_arjunnn9y8a7u6pa4n3e2'].includes(user?.username);

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Text style={[styles.title, { color: theme.text }]}>Unauthorized</Text>
        <Text style={{ color: theme.secondaryText }}>Admin access required.</Text>
      </View>
    );
  }

  const loadStatsAndHistory = async () => {
    try {
      setRefreshing(true);
      const base = await getServerUrl();
      const [sRes, hRes, nRes] = await Promise.all([
        fetch(`${base}/stats`).then(r => r.json()).catch(() => null),
        fetch(`${base}/broadcast-history`).then(r => r.json()).catch(() => null),
        fetch(`${base}/admin/notifications?limit=100`).then(r => r.json()).catch(() => null),
      ]);
      setServerOk(!!(sRes?.ok && hRes?.ok));
      if (sRes?.ok) setStats({ tokens: sRes.tokens || 0, emails: sRes.emails || 0, dailyTime: sRes.dailyTime || null }); else setStats((p)=>({ ...p }));
      if (hRes?.ok) setHistory(Array.isArray(hRes.history) ? hRes.history : []); else setHistory([]);
      if (nRes?.ok) {
        setNotifHistory(Array.isArray(nRes.notifications) ? nRes.notifications : []);
      } else {
        // Fallback: fetch directly from Supabase on device
        try {
          const sb = getSupabase();
          if (sb) {
            const { data, error } = await sb
              .from('notifications')
              .select('id,title,body,audience,created_at')
              .order('created_at', { ascending: false })
              .limit(100);
            if (!error && Array.isArray(data)) setNotifHistory(data);
          }
        } catch {}
      }
    } catch (e) {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  // Helpers: date range from filter
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const startOfWeek = (d) => {
    const day = d.getDay(); // 0 Sun..6 Sat
    const diff = (day + 6) % 7; // make Monday start (0)
    const s = new Date(d);
    s.setDate(d.getDate() - diff);
    s.setHours(0,0,0,0);
    return s;
  };
  const endOfWeek = (d) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23,59,59,999);
    return e;
  };
  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1, 0,0,0,0);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23,59,59,999);
  const startOfYear = (d) => new Date(d.getFullYear(), 0, 1, 0,0,0,0);
  const endOfYear = (d) => new Date(d.getFullYear(), 11, 31, 23,59,59,999);

  const getRange = () => {
    if (timeFilter === 'day') return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
    if (timeFilter === 'week') return { start: startOfWeek(new Date()), end: endOfWeek(new Date()) };
    if (timeFilter === 'month') return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    if (timeFilter === 'year') return { start: startOfYear(new Date()), end: endOfYear(new Date()) };
    if (timeFilter === 'custom') return { start: customRange.start, end: customRange.end };
    return { start: null, end: null };
  };

  const inRange = (ts) => {
    const { start, end } = getRange();
    if (!start || !end) return true;
    const t = new Date(ts).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  // Calendar grid (simple inline, no deps)
  const buildCalendar = (anchor) => {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekDay = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  };

  const weeks = buildCalendar(calendarMonth);

  const handleCreateInAppNotification = async () => {
    try {
      if (!message?.trim()) {
        Alert.alert('Message required', 'Please write a message to send.');
        return;
      }
      setSendingInApp(true);
      const base = await getServerUrl();
      const res = await fetch(`${base}/admin/notifications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'EduNepal',
          body: message,
          audience,
          data: { type: category || 'system', source: 'admin-ui' },
          created_by: user?.id || null,
        })
      });
      const data = await res.json();
      if (data?.ok) {
        Alert.alert('Created', 'In-app notification row created in Supabase. Clients will receive via realtime.');
      } else {
        throw new Error(data?.error || 'Failed to create');
      }
    } catch (e) {
      const msg = (e?.message || '').includes('Network request failed')
        ? 'Network error. Check server URL and device-network reachability.'
        : String(e?.message || e);
      Alert.alert('Failed to create', msg);
    } finally {
      setSendingInApp(false);
    }
  };

  // Load current server URL for editing
  useEffect(() => {
    (async () => {
      try {
        const base = await getServerUrl();
        setServerUrl(base || '');
      } catch {}
    })();
  }, []);

  const handleSaveServerUrl = async () => {
    try {
      if (!serverUrl || !/^https?:\/\//i.test(serverUrl)) {
        Alert.alert('Invalid URL', 'Please enter a valid http(s) URL, e.g. http://192.168.1.50:4000');
        return;
      }
      setSavingUrl(true);
      await saveServerUrl(serverUrl.trim());
      Alert.alert('Saved', 'Server URL updated. Retrying fetch...');
      // Optionally refresh stats/history after saving
      loadStatsAndHistory();
    } catch (e) {
      Alert.alert('Save failed', String(e?.message || e));
    } finally { setSavingUrl(false); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => {
    setSelected(new Set(history.map(h => h.id)));
  };
  const unselectAll = () => setSelected(new Set());

  // Selection for Supabase notifications
  const toggleSelectNotif = (id) => {
    setSelectedNotifs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllNotifs = () => setSelectedNotifs(new Set(notifHistory.map(n => n.id)));
  const unselectAllNotifs = () => setSelectedNotifs(new Set());

  const deleteSelected = async () => {
    if (selected.size === 0) return Alert.alert('Nothing selected', 'Select one or more entries.');
    try {
      const base = await getServerUrl();
      const res = await fetch(`${base}/broadcast-history/delete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selected) })
      });
      const data = await res.json();
      if (data?.ok) {
        unselectAll();
        loadStatsAndHistory();
      } else {
        throw new Error(data?.error || 'Delete failed');
      }
    } catch (e) {
      Alert.alert('Delete failed', String(e?.message || e));
    }
  };

  const deleteAll = async () => {
    Alert.alert('Delete all history', 'This will remove all broadcast history entries.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const base = await getServerUrl();
            const res = await fetch(`${base}/broadcast-history`, { method: 'DELETE' });
            const data = await res.json();
            if (data?.ok) {
              unselectAll();
              loadStatsAndHistory();
            } else {
              throw new Error(data?.error || 'Delete failed');
            }
          } catch (e) {
            Alert.alert('Delete failed', String(e?.message || e));
          }
        }
      }
    ]);
  };

  useEffect(() => {
    loadStatsAndHistory();
  }, []);

  const handleBroadcast = async () => {
    try {
      if (!message?.trim()) {
        Alert.alert('Message required', 'Please write a message to send.');
        return;
      }
      setLoading(true);
      const base = await getServerUrl();
      const res = await fetch(`${base}/broadcast-random`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, title: title || 'EduNepal' }),
      });
      const data = await res.json();
      if (data?.ok) {
        Alert.alert('Scheduled', `Broadcast scheduled in ~${Math.round((data.scheduledInSeconds || 0) / 60)} min`);
        loadStatsAndHistory();
      } else {
        throw new Error(data?.error || 'Failed to schedule');
      }
    } catch (e) {
      const msg = (e?.message || '').includes('Network request failed')
        ? 'Network error. Check server URL and device-network reachability.'
        : String(e?.message || e);
      Alert.alert('Failed to schedule', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    try {
      if (!message?.trim()) {
        Alert.alert('Message required', 'Please write a message to send.');
        return;
      }
      setSendingNow(true);
      const base = await getServerUrl();
      const res = await fetch(`${base}/broadcast-now`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, title: title || 'EduNepal' })
      });
      const data = await res.json();
      if (data?.ok) {
        Alert.alert('Sent', 'Broadcast delivered to registered devices.');
        loadStatsAndHistory();
      } else {
        throw new Error(data?.error || 'Failed to send');
      }
    } catch (e) {
      const msg = (e?.message || '').includes('Network request failed')
        ? 'Network error. Check server URL and device-network reachability.'
        : String(e?.message || e);
      Alert.alert('Failed to send', msg);
    } finally {
      setSendingNow(false);
    }
  };

  const handleScheduleDaily = async () => {
    try {
      if (!message?.trim()) {
        Alert.alert('Message required', 'Please write a message to send.');
        return;
      }
      setLoading(true);
      const base = await getServerUrl();
      const res = await fetch(`${base}/schedule-daily`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, title: title || 'EduNepal', hour, minute })
      });
      const data = await res.json();
      if (data?.ok) {
        Alert.alert('Scheduled', `Daily at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} (first at ${new Date(data.firstRunAt).toLocaleString()})`);
        loadStatsAndHistory();
      } else {
        throw new Error(data?.error || 'Failed to schedule');
      }
    } catch (e) {
      const msg = (e?.message || '').includes('Network request failed')
        ? 'Network error. Check server URL and device-network reachability.'
        : String(e?.message || e);
      Alert.alert('Failed to schedule', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLocal = async () => {
    if (!message?.trim()) {
      Alert.alert('Message required', 'Please write a message to send.');
      return;
    }
    const delay = await scheduleLocalRandomNotification(message, 'EduNepal');
    Alert.alert('Local scheduled', `A local notification will show in ~${Math.round(delay / 60)} min on this device.`);
  };

  // Delete saved template from AsyncStorage
  const deleteTemplate = async () => {
    try {
      const exists = await AsyncStorage.getItem('notif_template');
      if (!exists) {
        Alert.alert('Nothing to delete', 'No saved template found.');
        return;
      }
      await AsyncStorage.removeItem('notif_template');
      Alert.alert('Deleted', 'Template deleted.');
    } catch (e) {
      Alert.alert('Delete failed', String(e?.message || e));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.text }]}>System Notifications</Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Send a message to all users. Choose immediate, random-within-24h, or a fixed daily time.</Text>

      {/* Dev: Server URL override */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border || '#ddd', marginBottom: 8 }]}> 
        <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 6 }}>Server URL (dev)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border || '#ddd' }]}
          placeholder="http://192.168.x.x:4000 or http://10.0.2.2:4000"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="none"
          autoCorrect={false}
          value={serverUrl}
          onChangeText={setServerUrl}
        />
        <TouchableOpacity style={[styles.buttonOutline, { borderColor: theme.primary, marginTop: 10 }]} onPress={handleSaveServerUrl} disabled={savingUrl}>
          <Text style={[styles.btnTextOutline, { color: theme.primary }]}>{savingUrl ? 'Saving…' : 'Save Server URL'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border || '#ddd' }]}>
        <View style={styles.rowBetween}>
          <Text style={{ color: theme.text, fontWeight: '700' }}>Recipients</Text>
          <TouchableOpacity onPress={loadStatsAndHistory} disabled={refreshing}>
            <Text style={{ color: theme.primary }}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: theme.secondaryText, marginTop: 6 }}>Push tokens: {stats.tokens} | Emails: {stats.emails} {stats.dailyTime ? `| Daily: ${stats.dailyTime}` : ''}</Text>
        {!serverOk && (
          <Text style={{ color: '#ef4444', marginTop: 6, fontSize: 12 }}>
            Admin server unreachable. Showing in-app notifications via Supabase fallback.
          </Text>
        )}
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border || '#ddd' }]}
        placeholder="Title"
        placeholderTextColor={theme.secondaryText}
        value={title}
        onChangeText={setTitle}
      />
      <View style={styles.counterRow}>
        <Text style={[styles.counterText, { color: theme.secondaryText }]}>Title: {title.length}/64</Text>
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border || '#ddd' }]}
        placeholder="Message"
        placeholderTextColor={theme.secondaryText}
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <View style={styles.counterRow}>
        <Text style={[styles.counterText, { color: theme.secondaryText }]}>Message: {message.length}/240</Text>
      </View>

      <View style={[styles.rowBetween, { marginTop: 8 }]}>
        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: theme.primary, flex: 1, marginRight: 6 }]}
          onPress={async () => {
            try {
              await AsyncStorage.setItem('notif_template', JSON.stringify({ title, message }));
              Alert.alert('Saved', 'Template saved.');
            } catch { }
          }}
        >
          <Text style={[styles.btnTextOutline, { color: theme.primary }]}>Save Template</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: theme.primary, flex: 1, marginLeft: 6 }]}
          onPress={async () => {
            try {
              const raw = await AsyncStorage.getItem('notif_template');
              if (!raw) return Alert.alert('No template', 'Save one first.');
              const obj = JSON.parse(raw);
              setTitle(obj.title || 'EduNepal');
              setMessage(obj.message || '');
            } catch { }
          }}
        >
          <Text style={[styles.btnTextOutline, { color: theme.primary }]}>Load Template</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.buttonOutline, { borderColor: '#ef4444', marginTop: 8 }]}
        onPress={deleteTemplate}
      >
        <Text style={[styles.btnTextOutline, { color: '#ef4444' }]}>Delete Template</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSendNow} disabled={sendingNow}>
        <Text style={styles.btnText}>{sendingNow ? 'Sending…' : 'Send Now (Immediate)'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.buttonOutline, { borderColor: theme.primary }]} onPress={handleBroadcast} disabled={loading}>
        <Text style={[styles.btnTextOutline, { color: theme.primary }]}>{loading ? 'Scheduling…' : 'Schedule (Random within 24h)'}</Text>
      </TouchableOpacity>

      {/* In-app (Supabase) notification creator */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border || '#ddd', marginTop: 10 }]}> 
        <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 6 }}>In-App Notification (Supabase)</Text>
        <Text style={{ color: theme.secondaryText, marginBottom: 6 }}>Audience: 'all' | 'user:&lt;id&gt;' | 'segment:&lt;id&gt;'</Text>
        <Text style={{ color: theme.secondaryText, marginBottom: 6 }}>Category: study | content | system | marketing</Text>
        <View style={[styles.row, { flexWrap: 'wrap', marginBottom: 8 }]}> 
          {['study','content','system','marketing'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, category===key ? { backgroundColor: theme.primary } : { borderColor: theme.border || '#ddd' }]}
              onPress={() => setCategory(key)}
            >
              <Text style={[styles.chipText, { color: category===key ? '#fff' : theme.text }]}>{key.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border || '#ddd' }]}
          placeholder="all or user:&lt;uuid&gt;"
          placeholderTextColor={theme.secondaryText}
          autoCapitalize="none"
          autoCorrect={false}
          value={audience}
          onChangeText={setAudience}
        />
        <TouchableOpacity style={[styles.buttonOutline, { borderColor: theme.primary, marginTop: 10 }]} onPress={handleCreateInAppNotification} disabled={sendingInApp}>
          <Text style={[styles.btnTextOutline, { color: theme.primary }]}>{sendingInApp ? 'Creating…' : 'Create In-App Notification'}</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.secondaryText, marginTop: 8, fontSize: 12 }}>
          Requires server Supabase env vars (SUPABASE_URL, SUPABASE_SERVICE_KEY). Clients receive via realtime subscription.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.buttonOutline, { borderColor: theme.primary }]}
        onPress={handleLocal}
      >
        <Text style={[styles.btnTextOutline, { color: theme.primary }]}>Schedule Local (this device)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.buttonOutline, { borderColor: theme.primary }]}
        onPress={async () => {
          if (!message?.trim()) return Alert.alert('Message required', 'Please write a message to preview.');
          try {
            const enabled = await getNotificationsEnabled();
            if (!enabled) {
              return Alert.alert('Notifications disabled', 'Enable notifications in Settings to preview.');
            }
            // Not supported on web
            if (typeof window !== 'undefined' && window.document) {
              return Alert.alert('Not supported on web', 'Immediate local preview is only available on iOS/Android.');
            }
            await Notifications.scheduleNotificationAsync({
              content: { title: title || 'EduNepal', body: message, sound: 'default', data: { type: category || 'system', source: 'preview' } },
              trigger: null, // immediate
            });
          } catch (e) {
            Alert.alert('Preview failed', String(e?.message || e));
          }
        }}
      >
        <Text style={[styles.btnTextOutline, { color: theme.primary }]}>Preview on this device (Immediate)</Text>
      </TouchableOpacity>

      <View style={[styles.row, { marginTop: 16 }]}>
        <Text style={{ color: theme.text, fontWeight: '600', marginRight: 8 }}>Daily time</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border || '#ddd' }]} onPress={() => setHour((h) => (h + 23) % 24)}>
          <Text style={{ color: theme.text }}>-</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, marginHorizontal: 8 }}>{String(hour).padStart(2, '0')}</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border || '#ddd' }]} onPress={() => setHour((h) => (h + 1) % 24)}>
          <Text style={{ color: theme.text }}>+</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, marginHorizontal: 6 }}>:</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border || '#ddd' }]} onPress={() => setMinute((m) => (m + 59) % 60)}>
          <Text style={{ color: theme.text }}>-</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, marginHorizontal: 8 }}>{String(minute).padStart(2, '0')}</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border || '#ddd' }]} onPress={() => setMinute((m) => (m + 1) % 60)}>
          <Text style={{ color: theme.text }}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]} onPress={handleScheduleDaily} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Scheduling…' : 'Schedule Daily Broadcast'}</Text>
      </TouchableOpacity>

      {/* Filters */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border || '#ddd', marginTop: 8 }]}> 
        <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 8 }}>History Filters</Text>
        <View style={styles.filterRow}>
          {['day','week','month','year','custom'].map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, timeFilter===key ? { backgroundColor: theme.primary } : { borderColor: theme.border || '#ddd' }]}
              onPress={() => setTimeFilter(key)}
            >
              <Text style={[styles.chipText, { color: timeFilter===key ? '#fff' : theme.text }]}>{key.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {timeFilter === 'day' && (
          <View style={{ marginTop: 10 }}>
            <View style={styles.rowBetween}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()-1, 1))}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={{ color: theme.text, fontWeight: '600' }}>{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1, 1))}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarHeaderRow}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <Text key={d} style={[styles.calendarHeaderText, { color: theme.secondaryText }]}>{d}</Text>
              ))}
            </View>
            {weeks.map((w, i) => (
              <View key={i} style={styles.calendarWeekRow}>
                {w.map((d, j) => {
                  const isSelected = d && selectedDate && d.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={j}
                      style={[styles.calendarCell, isSelected ? { backgroundColor: theme.primary } : { borderColor: theme.border || '#eee' }]}
                      onPress={() => d && setSelectedDate(d)}
                      disabled={!d}
                    >
                      <Text style={{ color: isSelected ? '#fff' : theme.text }}>{d ? d.getDate() : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {timeFilter === 'custom' && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: theme.secondaryText, marginBottom: 6 }}>Enter ISO dates (YYYY-MM-DD)</Text>
            <View style={styles.rowBetween}>
              <TextInput
                placeholder="Start"
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { flex: 1, marginRight: 6, backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border || '#ddd' }]}
                onChangeText={(v)=> setCustomRange(r=>({ ...r, start: v? new Date(v): null }))}
              />
              <TextInput
                placeholder="End"
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { flex: 1, marginLeft: 6, backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border || '#ddd' }]}
                onChangeText={(v)=> setCustomRange(r=>({ ...r, end: v? new Date(v): null }))}
              />
            </View>
          </View>
        )}
      </View>

      {history?.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border || '#ddd', marginTop: 16 }]}> 
          <View style={styles.rowBetween}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>History</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={loadStatsAndHistory} disabled={refreshing} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                <Text style={[styles.actionText, { color: theme.primary }]}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
              </TouchableOpacity>
              {selected.size === history.length ? (
                <TouchableOpacity onPress={unselectAll} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                  <Text style={[styles.actionText, { color: theme.secondaryText }]}>Unselect all</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={selectAll} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                  <Text style={[styles.actionText, { color: theme.secondaryText }]}>Select all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={deleteSelected} disabled={selected.size === 0} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                <Text style={[styles.actionText, { color: selected.size === 0 ? theme.border : '#ef4444' }]}>Delete selected</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deleteAll} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                <Text style={styles.actionDangerText}>Delete all</Text>
              </TouchableOpacity>
            </View>
          </View>
          {history.filter(h => inRange(h.sentAt || h.scheduledAt)).slice(0, 50).map((h) => (
            <TouchableOpacity key={h.id} onPress={() => toggleSelect(h.id)} style={[styles.historyRow, { borderColor: theme.border }]}> 
              <Ionicons name={selected.has(h.id) ? 'checkbox-outline' : 'square-outline'} size={20} color={selected.has(h.id) ? theme.primary : theme.secondaryText} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{h.title} • {h.mode.toUpperCase()} • {h.status.toUpperCase()}</Text>
                <Text style={{ color: theme.secondaryText }} numberOfLines={3}>{h.message}</Text>
                <Text style={{ color: theme.secondaryText, fontSize: 12 }}>
                  {h.sentAt ? `Sent: ${new Date(h.sentAt).toLocaleString()}` : `Scheduled: ${new Date(h.scheduledAt).toLocaleString()}`}
                  {h.recipients ? ` • tokens: ${h.recipients.tokens} • emails: ${h.recipients.emails}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Supabase in-app notifications list with delete controls */}
      {notifHistory?.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border || '#ddd', marginTop: 16 }]}> 
          <View style={styles.rowBetween}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>In-App Notifications (Supabase)</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={loadStatsAndHistory} disabled={refreshing} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                <Text style={[styles.actionText, { color: theme.primary }]}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
              </TouchableOpacity>
              {selectedNotifs.size === notifHistory.length ? (
                <TouchableOpacity onPress={unselectAllNotifs} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                  <Text style={[styles.actionText, { color: theme.secondaryText }]}>Unselect all</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={selectAllNotifs} style={styles.actionBtn} hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}>
                  <Text style={[styles.actionText, { color: theme.secondaryText }]}>Select all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={async () => {
                  if (selectedNotifs.size === 0) return Alert.alert('Nothing selected', 'Select one or more entries.');
                  try {
                    const base = await getServerUrl();
                    const res = await fetch(`${base}/admin/notifications/bulk-delete`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selectedNotifs) })
                    });
                    const data = await res.json();
                    if (data?.ok) {
                      unselectAllNotifs();
                      loadStatsAndHistory();
                    } else {
                      throw new Error(data?.error || 'Delete failed');
                    }
                  } catch (e) {
                    Alert.alert('Delete failed', String(e?.message || e));
                  }
                }}
                disabled={selectedNotifs.size === 0}
                style={styles.actionBtn}
                hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}
              >
                <Text style={[styles.actionText, { color: selectedNotifs.size === 0 ? theme.border : '#ef4444' }]}>Delete selected</Text>
              </TouchableOpacity>
            </View>
          </View>

          {notifHistory.filter(n => inRange(n.created_at)).slice(0, 50).map((n) => (
            <View key={n.id} style={[styles.historyRow, { borderColor: theme.border }]}> 
              <TouchableOpacity onPress={() => toggleSelectNotif(n.id)}>
                <Ionicons name={selectedNotifs.has(n.id) ? 'checkbox-outline' : 'square-outline'} size={20} color={selectedNotifs.has(n.id) ? theme.primary : theme.secondaryText} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{n.title}</Text>
                {!!n.body && <Text style={{ color: theme.secondaryText }} numberOfLines={2}>{n.body}</Text>}
                <Text style={{ color: theme.secondaryText, fontSize: 12 }}>
                  {new Date(n.created_at).toLocaleString()} • {n.audience}
                </Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  Alert.alert('Delete notification', 'This will remove the notification for everyone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      try {
                        const base = await getServerUrl();
                        const res = await fetch(`${base}/admin/notifications/${n.id}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (data?.ok) {
                          loadStatsAndHistory();
                        } else {
                          throw new Error(data?.error || 'Delete failed');
                        }
                      } catch (e) {
                        Alert.alert('Delete failed', String(e?.message || e));
                      }
                    }}
                  ]);
                }}
                style={{ paddingHorizontal: 8, paddingVertical: 4 }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* No internal back; use index.js top icon */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Layout & typography
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, letterSpacing: 0.2 },
  subtitle: { fontSize: 13, marginBottom: 16, lineHeight: 18 },

  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    lineHeight: 20,
    textAlignVertical: 'top',
    marginTop: 10,
  },

  // Buttons
  button: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
  buttonOutline: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnTextOutline: { fontWeight: '700', letterSpacing: 0.3 },
  link: { marginTop: 16, alignItems: 'center' },

  // Rows & small controls
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 10 },

  // Cards
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginTop: 16,
  },

  // Meta
  counterRow: { marginTop: 4, alignItems: 'flex-end' },
  counterText: { fontSize: 12, letterSpacing: 0.2 },

  // Filter chips
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },

  // Calendar
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  calendarHeaderText: { width: `${100/7}%`, textAlign: 'center', fontSize: 12, opacity: 0.8 },
  calendarWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  calendarCell: { width: `${100/7}%`, aspectRatio: 1, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // History list
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1 },

  // Action buttons (mobile friendly)
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', marginLeft: 12 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 8, marginRight: 8, marginTop: 6, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: '600' },
  actionDangerText: { fontSize: 12, fontWeight: '700', color: '#ef4444' },
});
