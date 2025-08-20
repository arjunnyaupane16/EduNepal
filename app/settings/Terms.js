import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Terms() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const sections = [
    {
      title: t('termsAcceptanceTitle'),
      content: t('termsAcceptanceContent'),
    },
    {
      title: t('termsUseLicenseTitle'),
      content: t('termsUseLicenseContent'),
    },
    {
      title: t('termsUserAccountTitle'),
      content: t('termsUserAccountContent'),
    },
    {
      title: t('termsProhibitedUsesTitle'),
      content: t('termsProhibitedUsesContent'),
    },
    {
      title: t('termsContentTitle'),
      content: t('termsContentContent'),
    },
    {
      title: t('termsPrivacyPolicyTitle'),
      content: t('termsPrivacyPolicyContent'),
    },
    {
      title: t('termsTerminationTitle'),
      content: t('termsTerminationContent'),
    },
    {
      title: t('termsChangesTitle'),
      content: t('termsChangesContent'),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.header}>
        <Ionicons name="document-text" size={60} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>{t('termsConditions')}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>{t('termsUpdated')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.intro, { color: theme.text }]}> 
          {t('termsIntro')}
        </Text>

        {sections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: theme.card }]}> 
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: theme.text }]}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text }]}> 
            {t('termsQuestionsFooter')}
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