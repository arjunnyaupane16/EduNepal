import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const sections = [
    {
      title: t('privacyInfoWeCollectTitle'),
      content: t('privacyInfoWeCollectContent'),
    },
    {
      title: t('privacyHowWeUseTitle'),
      content: t('privacyHowWeUseContent'),
    },
    {
      title: t('privacySharingTitle'),
      content: t('privacySharingContent'),
    },
    {
      title: t('privacySecurityTitle'),
      content: t('privacySecurityContent'),
    },
    {
      title: t('privacyYourRightsTitle'),
      content: t('privacyYourRightsContent'),
    },
    {
      title: t('privacyChangesTitle'),
      content: t('privacyChangesContent'),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>{t('privacyPolicy')}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>{t('privacyUpdated')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.intro, { color: theme.text }]}>
          {t('privacyIntro')}
        </Text>

        {sections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: theme.text }]}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text }]}>
            {t('privacyContactFooter')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
  },
  section: {
    padding: 20,
    marginVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  footer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
});