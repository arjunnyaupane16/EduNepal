// app/settings/HelpSupport.js
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function HelpSupport() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: t('faqResetPasswordQ'),
      a: t('faqResetPasswordA'),
    },
    {
      q: t('faqContactSupportQ'),
      a: t('faqContactSupportA'),
    },
    {
      q: t('faqPrivacyQ'),
      a: t('faqPrivacyA'),
    },
    {
      q: t('faqDeleteAccountQ'),
      a: t('faqDeleteAccountA'),
    },
  ];

  const toggleFaq = (idx) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  const quickActions = [
    {
      icon: 'mail',
      label: t('emailSupport'),
      onPress: () => Linking.openURL('mailto:elearnnep@16gmail.com?subject=elearn%20Support'),
    },
    {
      icon: 'call',
      label: t('callUs'),
      onPress: () => Linking.openURL('tel:+9779864158297'),
    },
    {
      icon: 'chatbubbles',
      label: t('contact'),
      onPress: () => router.push('/settings/Contact'),
    },
    {
      icon: 'share-social',
      label: t('shareApp'),
      onPress: async () => {
        try {
          await Share.share({
            message: t('shareAppMessage'),
          });
        } catch (e) {
          Alert.alert(t('unableToShareNow'));
        }
      },
    },
  ];

  const openPrivacy = () => router.push('/settings/PrivacyPolicy');
  const openTerms = () => router.push('/settings/Terms');
  const openWebsite = () => Linking.openURL('https://www.elearn.com');
  const reportBug = () =>
    Linking.openURL(
      'mailto:support@elearn.com?subject=Bug%20Report%20(elearn%20Nep)&body=Describe%20the%20issue%20and%20steps%20to%20reproduce:'
    );

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );

  const RowAction = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border },
      ]}
    >
      <View style={styles.rowLeft}>
        <MaterialIcons name={icon} size={22} color={theme.text} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Ionicons name="help-circle" size={56} color={theme.primary || '#3b82f6'} />
        <Text style={[styles.title, { color: theme.text }]}>{t('helpSupport') || 'Help & Support'}</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          {t('helpSupportSubtitle')}
        </Text>
      </View>

      <Section title={t('quickActions')}>
        <View style={styles.quickGrid}>
          {quickActions.map((qa, i) => (
            <TouchableOpacity
              key={i}
              onPress={qa.onPress}
              style={[styles.quickItem, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border }]}
            >
              <View style={styles.quickIconWrap}>
                <Ionicons name={qa.icon} size={22} color={theme.primary || '#3b82f6'} />
              </View>
              <Text style={[styles.quickLabel, { color: theme.text }]}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title={t('faqs')}>
        <View>
          {faqs.map((f, idx) => {
            const open = openFaq === idx;
            return (
              <View
                key={idx}
                style={[
                  styles.faqItem,
                  { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border },
                ]}
              >
                <TouchableOpacity style={styles.faqHeader} onPress={() => toggleFaq(idx)}>
                  <Text style={[styles.faqQ, { color: theme.text }]}>{f.q}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.secondaryText}
                  />
                </TouchableOpacity>
                {open && <Text style={[styles.faqA, { color: theme.secondaryText }]}>{f.a}</Text>}
              </View>
            );
          })}
        </View>
      </Section>

      <Section title={t('resources')}>
        <RowAction icon="policy" title={t('privacyPolicy')} onPress={openPrivacy} />
        <RowAction icon="gavel" title={t('termsConditions')} onPress={openTerms} />
        <RowAction icon="public" title={t('visitWebsite')} subtitle="www.elearn.com" onPress={openWebsite} />
        <RowAction icon="bug-report" title={t('reportBug')} onPress={reportBug} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },

  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickItem: {
    width: '48%',
    marginHorizontal: '1%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, marginTop: 2, opacity: 0.8 },

  faqItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQ: { fontSize: 15, fontWeight: '700' },
  faqA: { fontSize: 13, marginTop: 8, lineHeight: 18 },
});
