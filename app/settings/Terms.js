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
      title: 'Acceptance of Terms',
      content: 'By accessing and using EduNepal, you accept and agree to be bound by the terms and provision of this agreement.',
    },
    {
      title: 'Use License',
      content: 'Permission is granted to temporarily access EduNepal for personal, non-commercial transitory viewing only.',
    },
    {
      title: 'User Account',
      content: 'You are responsible for safeguarding your account credentials and for all activities that occur under your account.',
    },
    {
      title: 'Prohibited Uses',
      content: 'You may not use our service for any illegal or unauthorized purpose or to violate any laws in your jurisdiction.',
    },
    {
      title: 'Content',
      content: 'Our service allows you to access educational content. You are responsible for your use of the content and must respect intellectual property rights.',
    },
    {
      title: 'Privacy Policy',
      content: 'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.',
    },
    {
      title: 'Termination',
      content: 'We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms.',
    },
    {
      title: 'Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. We will notify users of any material changes.',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>Terms & Conditions</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Last updated: January 2024</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.intro, { color: theme.text }]}>
          Please read these Terms and Conditions carefully before using EduNepal. 
          These terms govern your use of our educational platform and services.
        </Text>

        {sections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: theme.cardBackground || '#fff' }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: theme.text }]}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text }]}>
            If you have any questions about these Terms and Conditions, please contact us at legal@edunepal.com
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