

// app/settings/AboutApp.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function AboutApp() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Text style={[styles.title, { color: theme.text }]}>{t('eduNepal')} - About</Text>
      <Text style={[styles.text, { color: theme.text }]}>Version: 1.2.3</Text>
      <Text style={[styles.text, { color: theme.text }]}>Made with ❤️ by elearn Nep Team</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
});
