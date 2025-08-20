// app/settings/TermsConditions.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function TermsConditions() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={56} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>{t('termsConditions')}</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>{t('eduNepal')}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card }]}> 
        <Text style={[styles.paragraph, { color: theme.text }]}>
          {t('termsPlaceholder')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
});
