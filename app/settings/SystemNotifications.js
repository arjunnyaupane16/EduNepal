import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { scheduleLocalRandomNotification, getServerUrl } from '../../utils/notifications';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

export default function SystemNotifications() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('Study reminder: Open EduNepal today!');
  const [loading, setLoading] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Unauthorized</Text>
        <Text style={{ color: theme.secondaryText }}>Admin access required.</Text>
      </View>
    );
  }

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
        body: JSON.stringify({ message, title: 'EduNepal' }),
      });
      const data = await res.json();
      if (data?.ok) {
        Alert.alert('Scheduled', `Broadcast scheduled in ~${Math.round((data.scheduledInSeconds||0)/60)} min`);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, title: 'EduNepal' })
      });
      const data = await res.json();
      if (data?.ok) {
        Alert.alert('Sent', 'Broadcast delivered to registered devices.');
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, title: 'EduNepal', hour, minute })
      });
      const data = await res.json();
      if (data?.ok) {
        Alert.alert('Scheduled', `Daily at ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} (first at ${new Date(data.firstRunAt).toLocaleString()})`);
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
    Alert.alert('Local scheduled', `A local notification will show in ~${Math.round(delay/60)} min on this device.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>System Notifications</Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Send a message to all users. Choose immediate, random-within-24h, or a fixed daily time.</Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border||'#ddd' }]}
        placeholder="Message"
        placeholderTextColor={theme.secondaryText}
        value={message}
        onChangeText={setMessage}
        multiline
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSendNow} disabled={sendingNow}>
        <Text style={styles.btnText}>{sendingNow ? 'Sending…' : 'Send Now (Immediate)'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.buttonOutline, { borderColor: theme.primary }]} onPress={handleBroadcast} disabled={loading}>
        <Text style={[styles.btnTextOutline, { color: theme.primary }]}>{loading ? 'Scheduling…' : 'Schedule (Random within 24h)'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.buttonOutline, { borderColor: theme.primary }]} onPress={handleLocal}>
        <Text style={[styles.btnTextOutline, { color: theme.primary }]}>Schedule Local (this device)</Text>
      </TouchableOpacity>

      <View style={[styles.row, { marginTop: 16 }]}>
        <Text style={{ color: theme.text, fontWeight: '600', marginRight: 8 }}>Daily time</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border||'#ddd' }]} onPress={() => setHour((h)=> (h+23)%24)}>
          <Text style={{ color: theme.text }}>-</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, marginHorizontal: 8 }}>{String(hour).padStart(2,'0')}</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border||'#ddd' }]} onPress={() => setHour((h)=> (h+1)%24)}>
          <Text style={{ color: theme.text }}>+</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, marginHorizontal: 6 }}>:</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border||'#ddd' }]} onPress={() => setMinute((m)=> (m+59)%60)}>
          <Text style={{ color: theme.text }}>-</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text, marginHorizontal: 8 }}>{String(minute).padStart(2,'0')}</Text>
        <TouchableOpacity style={[styles.timeBtn, { borderColor: theme.border||'#ddd' }]} onPress={() => setMinute((m)=> (m+1)%60)}>
          <Text style={{ color: theme.text }}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]} onPress={handleScheduleDaily} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Scheduling…' : 'Schedule Daily Broadcast'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.link]} onPress={() => router.back()}>
        <Text style={{ color: theme.primary }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 90, textAlignVertical: 'top' },
  button: { marginTop: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  buttonOutline: { marginTop: 10, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  btnTextOutline: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
  timeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 8 },
  link: { marginTop: 16, alignItems: 'center' },
});
