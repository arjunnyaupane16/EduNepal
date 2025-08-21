

// app/settings/AboutApp.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const InfoRow = ({ icon, label, value, onPress, theme }) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.7 : 1}
    onPress={onPress}
    style={[styles.row, { backgroundColor: theme.cardBackground }]}
  >
    <MaterialIcons name={icon} size={20} color={theme.text} style={{ marginRight: 10 }} />
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {!!value && <Text style={[styles.rowValue, { color: theme.secondaryText }]}>{value}</Text>}
    </View>
    {!!onPress && <MaterialIcons name="chevron-right" size={20} color={theme.secondaryText} />}
  </TouchableOpacity>
);

export default function AboutApp() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();

  const version =
    Constants?.expoConfig?.version ||
    Constants?.manifest?.version ||
    '1.2.3';
  const appName = t('elearnnep') || 'eLearn Nepal';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.text }]}>{appName}</Text>
        <Text style={[styles.tagline, { color: theme.secondaryText }]}>{t('aboutTagline') || 'Learn. Grow. Succeed.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('about') || 'About'}</Text>
        <InfoRow icon="info" label={`${t('version') || 'Version'}`} value={version} theme={theme} />
        <InfoRow icon="favorite" label={t('madeWithLove') || 'Made with ❤️'} value="elearn Nepal Team" theme={theme} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('links') || 'Links'}</Text>
        <InfoRow
          icon="public"
          label={t('website') || 'Website'}
          value="https://elearnnepal.com"
          onPress={() => Linking.openURL('https://elearnnepal.com')}
          theme={theme}
        />
        <InfoRow
          icon="email"
          label={t('email') || 'Email'}
          value="support@elearnnepal.com"
          onPress={() => Linking.openURL('mailto:support@elearnnepal.com')}
          theme={theme}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('legal') || 'Legal'}</Text>
        <InfoRow
          icon="security"
          label={t('privacyPolicy') || 'Privacy Policy'}
          onPress={() => router.push('/settings/PrivacyPolicy')}
          theme={theme}
        />
        <InfoRow
          icon="gavel"
          label={t('termsConditions') || 'Terms & Conditions'}
          onPress={() => router.push('/settings/Terms')}
          theme={theme}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 12,
    marginTop: 2,
  },
});
