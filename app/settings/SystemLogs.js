import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SystemLogs() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const isAdmin = user?.role === 'Administrator' || user?.username === 'admin';

  if (!isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Access denied. Admins only.</Text>
      </View>
    );
  }

  const demoLogs = [
    '[INFO] Server started on port 4000',
    '[INFO] Expo push scheduler initialized',
    '[WARN] No SMTP credentials found, email fallback disabled',
    '[INFO] Registered push token for device XYZ',
    '[INFO] Registered email for user arjunnyaupane135@gmail.com',
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: theme.text }]}>System Logs</Text>
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}>
        {demoLogs.map((line, idx) => (
          <Text key={idx} style={{ color: theme.secondaryText, marginBottom: 8 }}>
            {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
});
