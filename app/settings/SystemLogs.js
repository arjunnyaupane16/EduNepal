import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SystemLogs() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ALL'); // ALL | INFO | WARN | ERROR
  const [live, setLive] = useState(false);
  const liveTimer = useRef(null);
  const [logs, setLogs] = useState(() => [
    { ts: Date.now() - 60000 * 5, level: 'INFO', msg: 'Server started on port 4000' },
    { ts: Date.now() - 60000 * 4, level: 'INFO', msg: 'Expo push scheduler initialized' },
    { ts: Date.now() - 60000 * 3, level: 'WARN', msg: 'No SMTP credentials found, email fallback disabled' },
    { ts: Date.now() - 60000 * 2, level: 'INFO', msg: 'Registered push token for device XYZ' },
    { ts: Date.now() - 60000 * 1, level: 'INFO', msg: 'Registered email for user arjunnyaupane16@gmail.com' },
  ]);

  useEffect(() => {
    if (!live) {
      if (liveTimer.current) clearInterval(liveTimer.current);
      return;
    }
    liveTimer.current = setInterval(() => {
      setLogs(prev => {
        const levels = ['INFO', 'WARN', 'ERROR'];
        const lv = levels[Math.floor(Math.random() * levels.length)];
        const sample = {
          INFO: 'Background task finished successfully',
          WARN: 'High memory usage detected (~78%)',
          ERROR: 'Failed to fetch analytics snapshot (demo)'
        };
        return [
          { ts: Date.now(), level: lv, msg: sample[lv] },
          ...prev
        ].slice(0, 500);
      });
    }, 2500);
    return () => {
      if (liveTimer.current) clearInterval(liveTimer.current);
    };
  }, [live]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchesLevel = level === 'ALL' || l.level === level;
      const matchesQuery = !query || (l.msg?.toLowerCase().includes(query.toLowerCase()));
      return matchesLevel && matchesQuery;
    });
  }, [logs, level, query]);

  if (!isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Access denied. Admins only.</Text>
      </View>
    );
  }

  const formatTs = (ts) => new Date(ts).toLocaleTimeString();

  const clearLogs = () => {
    Alert.alert('Clear logs', 'Are you sure you want to clear all logs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setLogs([]) },
    ]);
  };

  const copyLogs = async () => {
    try {
      const text = logs.map(l => `[${l.level}] ${new Date(l.ts).toISOString()} ${l.msg}`).join('\n');
      await Share.share({ message: text });
    } catch (e) {
      Alert.alert('Share failed', String(e?.message || e));
    }
  };

  const exportLogs = async () => {
    try {
      const text = logs.map(l => `[${l.level}] ${new Date(l.ts).toISOString()} ${l.msg}`).join('\n');
      const fileUri = FileSystem.cacheDirectory + `system-logs-${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, text);
      Alert.alert('Exported', `Logs exported to: ${fileUri}`);
    } catch (e) {
      Alert.alert('Export failed', String(e?.message || e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.title, { color: theme.text }]}>System Logs</Text>

        <View style={[styles.toolbar, { borderColor: theme.border }]}>
          <TextInput
            placeholder="Search logs..."
            placeholderTextColor={theme.secondaryText}
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />

          <View style={styles.levelRow}>
            {['ALL', 'INFO', 'WARN', 'ERROR'].map(lv => (
              <TouchableOpacity
                key={lv}
                onPress={() => setLevel(lv)}
                style={[styles.levelBtn, { borderColor: theme.border, backgroundColor: level === lv ? (theme.cardBackground || '#fff') : 'transparent' }]}
              >
                <Text style={{ color: level === lv ? theme.text : theme.secondaryText, fontWeight: level === lv ? '700' : '400' }}>{lv}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => setLive(v => !v)} style={[styles.actionBtn, { borderColor: theme.border }]}>
              <Text style={{ color: live ? '#22c55e' : theme.text }}>{live ? 'Stop Live' : 'Live Stream'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={copyLogs} style={[styles.actionBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exportLogs} style={[styles.actionBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearLogs} style={[styles.actionBtn, { borderColor: theme.border }]}>
              <Text style={{ color: '#ef4444' }}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}>
          {filtered.length === 0 ? (
            <Text style={{ color: theme.secondaryText }}>No logs</Text>
          ) : (
            filtered.map((l, idx) => (
              <View key={idx} style={[styles.logRow, { borderColor: theme.border }]}> 
                <View style={[styles.badge, badgeStyle(l.level)]}>
                  <Text style={styles.badgeText}>{l.level}</Text>
                </View>
                <Text style={[styles.logTs, { color: theme.secondaryText }]}>{formatTs(l.ts)}</Text>
                <Text style={[styles.logMsg, { color: theme.text }]}>{l.msg}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );

  function badgeStyle(lv) {
    switch (lv) {
      case 'ERROR':
        return { backgroundColor: '#fee2e2', borderColor: '#fecaca' };
      case 'WARN':
        return { backgroundColor: '#fef3c7', borderColor: '#fde68a' };
      default:
        return { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' };
    }
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  toolbar: { borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  levelBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  card: { padding: 8, borderRadius: 12, borderWidth: 1 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginRight: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#111827' },
  logTs: { width: 70, fontSize: 12, marginRight: 8 },
  logMsg: { flex: 1, fontSize: 14 },
});
