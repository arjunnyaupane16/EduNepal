import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Use Supabase-hosted images
const SUPABASE_URL = 'https://eovzqcjgqmlaubzwwqpx.supabase.co';
const STORAGE_BUCKET = 'ElearnNepal';
const imageBase = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/images`;

// PDFs are stored in Supabase
const PDF_SUPABASE_URL = 'https://apqysgfnanmvkracjgtr.supabase.co';
const PDF_STORAGE_BUCKET = 'Arjun Nyaupane';
const pdfBase = `${PDF_SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(PDF_STORAGE_BUCKET)}`;

// Medium cover images from Supabase
const coverImages = {
  english: { uri: 'https://eovzqcjgqmlaubzwwqpx.supabase.co/storage/v1/object/public/Images/images/ENglish.png' },
  nepali: { uri: 'https://eovzqcjgqmlaubzwwqpx.supabase.co/storage/v1/object/public/Images/images/Nepali.webp' }
};

// Textbook data
const textbooks = {
  english: [
    {
      id: 'english_grade10',
      title: 'English - Grade 10',
      cover: coverImages.english,
      url: `${pdfBase}/English%20grade%2010.pdf`,
      units: [
        { title: 'Unit 1: Giving, Withholding and Reporting Permission', page: 1 },
        { title: 'Unit 2: Reporting Statements', page: 10 },
        { title: 'Unit 3: Reporting Questions', page: 20 },
        { title: 'Unit 4: Reporting Commands and Requests', page: 30 },
        { title: 'Unit 5: Passive Voice', page: 40 },
        { title: 'Unit 6: Causative Verbs', page: 50 },
        { title: 'Unit 7: Relative Clauses', page: 60 },
        { title: 'Unit 8: Connecting Ideas', page: 70 },
        { title: 'Unit 9: Conditional Sentences', page: 80 },
        { title: 'Unit 10: Expressing Wishes and Regrets', page: 90 },
      ]
    }
  ],
  nepali: [
    // Add Nepali textbooks here when needed
  ]
};
export default function Class10Textbooks() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [expandedMedium, setExpandedMedium] = useState(null);
  const colorScheme = useColorScheme();

  // Translations for subject names
  const subjectTranslations = {
    english: {
      'English': t('english'),
      'Mathematics': t('mathematics'),
      'Science': t('science'),
      'Social Studies': t('socialStudies'),
      'Computer Science': t('computerScience'),
      'Optional Mathematics': t('optionalMath')
    },
    nepali: {
      'नेपाली': t('nepali'),
      'गणित': t('mathematics'),
      'विज्ञान': t('science'),
      'सामाजिक अध्ययन': t('socialStudies'),
      'कम्प्युटर विज्ञान': t('computerScience'),
      'वैकल्पिक गणित': t('optionalMath')
    }
  };

  const subjects = {
    english: [
      { id: 1, name: 'English', code: 'ENG001' },
      { id: 2, name: 'Mathematics', code: 'MATH001' },
      { id: 3, name: 'Science', code: 'SCI001' },
      { id: 4, name: 'Social Studies', code: 'SOC001' },
      { id: 5, name: 'Computer Science', code: 'COMP001' },
      { id: 6, name: 'Optional Mathematics', code: 'OPT_MATH' },
    ],
    nepali: [
      { id: 1, name: 'नेपाली', code: 'NEP001' },
      { id: 2, name: 'गणित', code: 'MATH001' },
      { id: 3, name: 'विज्ञान', code: 'SCI001' },
      { id: 4, name: 'सामाजिक अध्ययन', code: 'SOC001' },
      { id: 5, name: 'कम्प्युटर विज्ञान', code: 'COMP001' },
      { id: 6, name: 'वैकल्पिक गणित', code: 'OPT_MATH' },
    ]
  };

  const toggleMedium = (medium) => {
    setExpandedMedium(expandedMedium === medium ? null : medium);
  };

  const handleTextbookPress = (textbook) => {
    router.push({
      pathname: '/classes/class10/viewer',
      params: {
        title: textbook.title,
        url: textbook.url,
        units: JSON.stringify(textbook.units)
      }
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerWrap}>
        <Text style={[styles.title, { color: theme.text }]}>{t('class10Textbooks')}</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{t('chooseMediumAndSubject')}</Text>
      </View>

      <View style={styles.mediumsContainer}>
        {Object.entries(coverImages).map(([medium, image]) => (
          <View key={medium} style={[
            styles.mediumWrapper,
            { borderColor: theme.primary, borderWidth: 1.5, borderRadius: 16 }
          ]}>
            <TouchableOpacity
              style={[
                styles.mediumCard,
                {
                  backgroundColor: theme.card,
                  borderColor: 'transparent',
                  borderLeftWidth: 0,
                  borderRightWidth: 0,
                  borderTopWidth: 0
                },
                expandedMedium === medium && {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  borderBottomWidth: 1.5,
                  borderBottomColor: theme.primary
                }
              ]}
              onPress={() => toggleMedium(medium)}
              activeOpacity={0.8}
            >
              <View style={styles.mediumContent}>
                <Image
                  source={image}
                  style={styles.mediumImage}
                  resizeMode="contain"
                />
                <View style={styles.mediumTextWrap}>
                  <Text style={[styles.mediumText, { color: theme.text }]}>
                    {medium === 'english' ? t('englishMedium') : t('nepaliMedium')}
                  </Text>
                  <Text style={[styles.mediumSubText, { color: theme.secondaryText }]}>
                    {subjects[medium].length} {t('subjects')}
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name={expandedMedium === medium ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={28}
                color={theme.text}
              />
            </TouchableOpacity>

            {expandedMedium === medium && (
              <View style={[
                styles.subjectsContainer,
                { backgroundColor: theme.card, borderColor: theme.border }
              ]} >
                {subjects[medium].map((subject) => (
                  <TouchableOpacity 
                    key={subject.id}
                    onPress={() => {
                      const textbook = textbooks[medium]?.find(t => t.id === `${medium}_${subject.code.toLowerCase()}`);
                      if (textbook) {
                        handleTextbookPress(textbook);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.textbookCard, { backgroundColor: theme.card }]}>
                      <Image 
                        source={coverImages[medium]} 
                        style={styles.coverImage} 
                        resizeMode="cover"
                      />
                      <View style={styles.textbookInfo}>
                        <Text style={[styles.subjectName, { color: theme.text }]}>
                          {subjectTranslations[medium][subject.name] || subject.name}
                        </Text>
                        <Text style={[styles.subjectCode, { color: theme.secondaryText }]}>
                          {subject.code}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13.5,
    marginBottom: 14,
  },
  mediumsContainer: {
    gap: 14,
  },
  mediumWrapper: {
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  mediumCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  mediumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediumImage: {
    width: 55,
    height: 60,
    marginRight: 16,
    borderRadius: 12,
  },
  mediumTextWrap: {
    flex: 1,
  },
  mediumText: {
    fontSize: 16.5,
    fontWeight: '700',
    flex: 1,
  },
  mediumSubText: {
    fontSize: 12.5,
    marginTop: 2,
  },
  subjectsContainer: {
    borderTopWidth: 1,
    borderColor: '#eef2f7',
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    gap: 10,
  },
  textbookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  coverImage: {
    width: 60,
    height: 80,
    marginRight: 12,
    borderRadius: 8,
  },
  textbookInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 17.5,
    fontWeight: '600',
    flex: 1,
  },
  subjectCode: {
    fontSize: 13.5,
    marginTop: 2,
  },
})
;
