import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { scheduleLocalRandomNotification } from '../../utils/notifications';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

export default function SystemNotifications() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('Study reminder: Open EduNepal today!');
  const [loading, setLoading] = useState(false);
  const SERVER_URL = Constants?.expoConfig?.extra?.serverUrl ?? 'http://localhost:4000';

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
      const res = await fetch(`${SERVER_URL}/broadcast-random`, {
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
      Alert.alert('Failed to schedule', String(e?.message||e));
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
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Send a message to all users at a random time within 24 hours.</Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border||'#ddd' }]}
        placeholder="Message"
        placeholderTextColor={theme.secondaryText}
        value={message}
        onChangeText={setMessage}
        multiline
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleBroadcast} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Scheduling…' : 'Schedule Broadcast (24h random)'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.buttonOutline, { borderColor: theme.primary }]} onPress={handleLocal}>
        <Text style={[styles.btnTextOutline, { color: theme.primary }]}>Schedule Local (this device)</Text>
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
  link: { marginTop: 16, alignItems: 'center' },
});
