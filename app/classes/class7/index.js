import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import BottomNavBar from '../../../components/BottomNavBar';
import TopNavBar from '../../../components/TopNavBar';
import styles from '../../../styles/ClassScreenStyles';

export default function Class7() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const cardColors = [
    { bg: '#e0f2fe', icon: '#0ea5e9' },
    { bg: '#fef3c7', icon: '#f59e0b' },
    { bg: '#e0e7ff', icon: '#6366f1' },
    { bg: '#dcfce7', icon: '#22c55e' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopNavBar title="Class 7" showMenu={true} showNotifications={true} />

      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <MaterialIcons name="search" size={20} color={theme.placeholder} />
        <TextInput
          placeholder={t('searchBooksNotes')}
          placeholderTextColor={theme.placeholder}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/classes/class7/textbook')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: cardColors[0].bg }]}>
              <MaterialIcons name="menu-book" size={20} color={cardColors[0].icon} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{t('textbooks')}</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{t('cdcApprovedBooks')}</Text>
            <View style={[styles.arrow, { backgroundColor: theme.iconBackground }]}>
              <MaterialIcons name="chevron-right" size={16} color={theme.iconColor} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/classes/class7/guidebooks')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: cardColors[1].bg }]}>
              <MaterialIcons name="book-online" size={20} color={cardColors[1].icon} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{t('guidebooks')}</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{t('chapterWiseNotes')}</Text>
            <View style={[styles.arrow, { backgroundColor: theme.iconBackground }]}>
              <MaterialIcons name="chevron-right" size={16} color={theme.iconColor} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/classes/class7/previouspapers')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: cardColors[2].bg }]}>
              <MaterialIcons name="event-note" size={20} color={cardColors[2].icon} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{t('previousPapers')}</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{t('lastYearsExams')}</Text>
            <View style={[styles.arrow, { backgroundColor: theme.iconBackground }]}>
              <MaterialIcons name="chevron-right" size={16} color={theme.iconColor} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            onPress={() => router.push('/classes/class7/practicequestions')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: cardColors[3].bg }]}>
              <MaterialIcons name="check-circle-outline" size={20} color={cardColors[3].icon} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{t('practiceQuestions')}</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{t('expectedQuestions')}</Text>
            <View style={[styles.arrow, { backgroundColor: theme.iconBackground }]}>
              <MaterialIcons name="chevron-right" size={16} color={theme.iconColor} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.recentActivityHeader, { color: theme.text }]}>
          {t('recentActivity')}
        </Text>
      </ScrollView>

      <BottomNavBar active="home" />
    </View>
  );
}
