import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegionSettings() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Placeholder regions. Expand as needed.
  const regions = [
    { code: 'NP', name: 'Nepal' },
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
  ];

  const [region, setRegion] = useState('NP');

  const onSelectRegion = (code) => {
    setRegion(code);
    Alert.alert('Region Updated', `Content region set to ${regions.find(r => r.code === code)?.name || code}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="public" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>Content Region</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Choose your preferred content region</Text>
      </View>

      <View style={styles.list}>
        {regions.map(({ code, name }) => (
          <TouchableOpacity
            key={code}
            style={[styles.option, { backgroundColor: theme.cardBackground || '#fff' }, region === code && styles.selectedOption]}
            onPress={() => onSelectRegion(code)}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.text }]}>{name}</Text>
              {region === code && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text }]}>
          Region selection will tailor content recommendations. (Persistent storage coming soon)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 30, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 15, marginBottom: 5 },
  subtitle: { fontSize: 16, opacity: 0.7, textAlign: 'center' },
  list: { paddingHorizontal: 10 },
  option: {
    padding: 20,
    marginVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: { backgroundColor: '#e0f2fe', borderWidth: 2, borderColor: '#3b82f6' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 18, fontWeight: '600' },
  footer: { marginTop: 30, paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#f1f5f9', borderRadius: 12, marginHorizontal: 10 },
  footerText: { fontSize: 14, textAlign: 'center', opacity: 0.7, lineHeight: 20 },
});
