import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const LanguageRegion = () => {
  const { language, changeLanguage, getAvailableLanguages, t } = useLanguage();
  const { theme } = useTheme();
  const languages = getAvailableLanguages();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="language" size={60} color="#3b82f6" />
        <Text style={[styles.title, { color: theme.text }]}>{t('language')}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Choose your preferred language</Text>
      </View>

      <View style={styles.languageList}>
        {languages.map(({ code, name, nativeName }) => (
          <TouchableOpacity
            key={code}
            style={[
              styles.option,
              { backgroundColor: theme.cardBackground || '#fff' },
              language === code && styles.selectedOption,
            ]}
            onPress={() => changeLanguage(code)}
          >
            <View style={styles.optionContent}>
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.optionText,
                  { color: theme.text },
                  language === code && styles.selectedText,
                ]}>
                  {name}
                </Text>
                <Text style={[
                  styles.nativeText,
                  { color: theme.text },
                  language === code && styles.selectedText,
                ]}>
                  {nativeName}
                </Text>
              </View>
              {language === code && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.text }]}>
          Language changes will be applied immediately across the entire app.
        </Text>
      </View>
    </ScrollView>
  );
};

export default LanguageRegion;

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
  languageList: {
    paddingHorizontal: 10,
  },
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
  selectedOption: {
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageInfo: {
    flex: 1,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  nativeText: {
    fontSize: 16,
    opacity: 0.8,
  },
  selectedText: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginHorizontal: 10,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
});
