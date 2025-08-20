import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function DeveloperTools() {
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

  const actions = [
    { label: 'Ping Push Server', onPress: () => Alert.alert('Ping', 'Server reachable (demo)') },
    { label: 'Show Expo Constants', onPress: () => Alert.alert('Constants', 'See console for details') },
    { label: 'Clear In-Memory Registrations', onPress: () => Alert.alert('Demo', 'Not implemented in demo') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: theme.text }]}>Developer Tools</Text>
      <View style={[styles.card, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}>
        {actions.map((a, idx) => (
          <TouchableOpacity key={idx} style={[styles.row, { borderColor: theme.border }]} onPress={a.onPress}>
            <Text style={{ color: theme.text }}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  row: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
});
