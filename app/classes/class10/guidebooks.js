import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import BottomNavBar from '../../../components/BottomNavBar';
import styles from '../../../styles/ClassScreenStyles';
import { router } from 'expo-router';

export default function Guidebooks() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const subjects = [
    {
      title: 'English',
      description: 'Complete notes and grammar solutions',
      color: '#dbeafe',
      icon: 'menu-book',
      route: 'english',
    },
    {
      title: 'नेपाली',
      description: 'पाठ अनुसार व्याख्या र अभ्यास',
      color: '#fef9c3',
      icon: 'language', // Suitable icon for Nepali subject
      route: 'nepali',   // updated route for consistency
    },
    {
      title: 'Social',
      description: 'Key points and explanation',
      color: '#ede9fe',
      icon: 'public',
      route: 'social',
    },
    {
      title: 'Math',
      description: 'Solutions, formulas and examples',
      color: '#dcfce7',
      icon: 'calculate',
      route: 'math',
    },
  ];

  const filteredSubjects = subjects.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.title === 'नेपाली' && 'नेपाली'.includes(searchQuery)) // allows searching for Nepali
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <Text style={[styles.appTitle, { color: theme.text }]}>Guidebooks</Text>
        <View style={styles.rightIcons}>
          <MaterialIcons name="notifications-none" size={24} color={theme.text} />
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>AN</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, {
        backgroundColor: theme.cardBackground,
        borderColor: theme.border
      }]}>
        <MaterialIcons name="search" size={20} color={theme.placeholder} />
        <TextInput
          placeholder="Search subjects..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.classTitle, { color: theme.text }]}>Guidebooks</Text>

        <View style={styles.grid}>
          {filteredSubjects.map((subject, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => router.push(`/classes/class10/guidebooks/${subject.route}`)}
            >
              <View style={[styles.iconWrapper, { backgroundColor: subject.color }]}>
                <MaterialIcons name={subject.icon} size={20} color="#000" />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{subject.title}</Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{subject.description}</Text>
              <View style={[styles.arrow, { backgroundColor: theme.iconBackground }]}>
                <MaterialIcons name="chevron-right" size={16} color={theme.iconColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar active="home" />
    </View>
  );
}
