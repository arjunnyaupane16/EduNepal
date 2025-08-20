import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Contact() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const contactMethods = [
    {
      icon: 'mail',
      title: t('emailSupport'),
      subtitle: 'elearnnep@16gmail.com',
      action: () => Linking.openURL('mailto:elearnnep@16gmail.com'),
    },
    {
      icon: 'call',
      title: t('phoneSupport'),
      subtitle: '+977-9864158297',
      action: () => Linking.openURL('tel:+9779864158297'),
    },
    {
      icon: 'location',
      title: t('officeAddress'),
      subtitle: 'Kathmandu, Nepal',
      action: () => {},
    },
    {
      icon: 'globe',
      title: t('visitWebsite'),
      subtitle: 'www.elearn.com',
      action: () => Linking.openURL('https://www.elearn.com'),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="people" size={60} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>{t('contactUs')}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>{t('contactSubtitle')}</Text>
      </View>

      <View style={styles.contactList}>
        {contactMethods.map((method, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.contactItem, { backgroundColor: theme.cardBackground || '#fff' }]}
            onPress={method.action}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={method.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: theme.text }]}>{method.title}</Text>
              <Text style={[styles.contactSubtitle, { color: theme.text }]}>{method.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text }]}>
          {t('contactFooter')}
        </Text>
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
  contactList: {
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
});
