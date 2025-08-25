import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Platform, BackHandler } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Use Supabase-hosted images instead of bundling local PNGs to reduce app size
const SUPABASE_URL = Constants?.expoConfig?.extra?.supabaseUrl || 'https://eovzqcjgqmlaubzwwqpx.supabase.co';
const STORAGE_BUCKET = Constants?.expoConfig?.extra?.storageBucket || 'ElearnNepal';
const imageBase = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/images`;

// PDFs are stored in a different Supabase project/bucket
const PDF_SUPABASE_URL = Constants?.expoConfig?.extra?.pdfSupabaseUrl || 'https://apqysgfnanmvkracjgtr.supabase.co';
const PDF_STORAGE_BUCKET = Constants?.expoConfig?.extra?.pdfStorageBucket || 'Arjun Nyaupane';
const pdfBase = `${PDF_SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(PDF_STORAGE_BUCKET)}`;

// Medium cover images from Supabase
const coverImages = {
  english: { uri: 'https://eovzqcjgqmlaubzwwqpx.supabase.co/storage/v1/object/public/Images/images/ENglish.png' },
  nepali: { uri: 'https://eovzqcjgqmlaubzwwqpx.supabase.co/storage/v1/object/public/Images/images/Nepali.webp' }
};

export default function Class10Textbooks() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [expandedMedium, setExpandedMedium] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingIndex, setDownloadingIndex] = useState(null);

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

  const textbooks = {
    english: [
      {
        id: 1,
        name: 'English',
        code: 'ENG001',
        title: 'English Grade 10',
        url: `${pdfBase}/English%20Grade%2010.pdf`,
        cover: coverImages.english,
        units: [
          { title: 'Unit 1: Reading Comprehension', page: 5 },
          { title: 'Unit 2: Grammar and Vocabulary', page: 15 },
          { title: 'Unit 3: Writing Skills', page: 25 },
          { title: 'Unit 4: Literature', page: 35 },
          { title: 'Unit 5: Communication Skills', page: 45 }
        ]
      },
      {
        id: 2,
        name: 'Mathematics',
        code: 'MATH001',
        title: 'Mathematics Grade 10',
        url: `${pdfBase}/Mathematics%20Grade%2010.pdf`,
        cover: coverImages.english,
        units: [
          { title: 'Unit 1: Algebra', page: 5 },
          { title: 'Unit 2: Geometry', page: 15 },
          { title: 'Unit 3: Trigonometry', page: 25 },
          { title: 'Unit 4: Statistics', page: 35 },
          { title: 'Unit 5: Probability', page: 45 }
        ]
      },
      {
        id: 3,
        name: 'Science',
        code: 'SCI001',
        title: 'Science Grade 10',
        url: `${pdfBase}/Science%20Grade%2010.pdf`,
        cover: coverImages.english,
        units: [
          { title: 'Unit 1: Physics', page: 5 },
          { title: 'Unit 2: Chemistry', page: 15 },
          { title: 'Unit 3: Biology', page: 25 },
          { title: 'Unit 4: Environmental Science', page: 35 },
          { title: 'Unit 5: Scientific Method', page: 45 }
        ]
      },
      {
        id: 4,
        name: 'Social Studies',
        code: 'SOC001',
        title: 'Social Studies Grade 10',
        url: `${pdfBase}/Social%20Studies%20Grade%2010.pdf`,
        cover: coverImages.english,
        units: [
          { title: 'Unit 1: History', page: 5 },
          { title: 'Unit 2: Geography', page: 15 },
          { title: 'Unit 3: Civics', page: 25 },
          { title: 'Unit 4: Economics', page: 35 },
          { title: 'Unit 5: Culture and Society', page: 45 }
        ]
      },
      {
        id: 5,
        name: 'Computer Science',
        code: 'COMP001',
        title: 'Computer Science Grade 10',
        url: `${pdfBase}/Computer%20Science%20Grade%2010.pdf`,
        cover: coverImages.english,
        units: [
          { title: 'Unit 1: Programming Basics', page: 5 },
          { title: 'Unit 2: Data Structures', page: 15 },
          { title: 'Unit 3: Algorithms', page: 25 },
          { title: 'Unit 4: Database Management', page: 35 },
          { title: 'Unit 5: Web Development', page: 45 }
        ]
      },
      {
        id: 6,
        name: 'Optional Mathematics',
        code: 'OPT_MATH',
        title: 'Optional Mathematics Grade 10',
        url: `${pdfBase}/Optional%20Mathematics%20Grade%2010.pdf`,
        cover: coverImages.english,
        units: [
          { title: 'Unit 1: Advanced Algebra', page: 5 },
          { title: 'Unit 2: Calculus', page: 15 },
          { title: 'Unit 3: Vectors', page: 25 },
          { title: 'Unit 4: Matrices', page: 35 },
          { title: 'Unit 5: Complex Numbers', page: 45 }
        ]
      },
    ],
    nepali: [
      {
        id: 1,
        name: 'नेपाली',
        code: 'NEP001',
        title: 'नेपाली कक्षा १०',
        url: `${pdfBase}/Nepali%20Grade%2010.pdf`,
        cover: coverImages.nepali,
        units: [
          { title: 'पाठ १: नेपाली भाषा', page: 5 },
          { title: 'पाठ २: व्याकरण', page: 15 },
          { title: 'पाठ ३: साहित्य', page: 25 },
          { title: 'पाठ ४: लेखन', page: 35 },
          { title: 'पाठ ५: संचार', page: 45 }
        ]
      },
      {
        id: 2,
        name: 'गणित',
        code: 'MATH001',
        title: 'गणित कक्षा १०',
        url: `${pdfBase}/Mathematics%20Nepali%20Grade%2010.pdf`,
        cover: coverImages.nepali,
        units: [
          { title: 'पाठ १: बीजगणित', page: 5 },
          { title: 'पाठ २: ज्यामिति', page: 15 },
          { title: 'पाठ ३: त्रिकोणमिति', page: 25 },
          { title: 'पाठ ४: सांख्यिकी', page: 35 },
          { title: 'पाठ ५: सम्भावना', page: 45 }
        ]
      },
      {
        id: 3,
        name: 'विज्ञान',
        code: 'SCI001',
        title: 'विज्ञान कक्षा १०',
        url: `${pdfBase}/Science%20Nepali%20Grade%2010.pdf`,
        cover: coverImages.nepali,
        units: [
          { title: 'पाठ १: भौतिक विज्ञान', page: 5 },
          { title: 'पाठ २: रसायन विज्ञान', page: 15 },
          { title: 'पाठ ३: जीव विज्ञान', page: 25 },
          { title: 'पाठ ४: वातावरण विज्ञान', page: 35 },
          { title: 'पाठ ५: वैज्ञानिक विधि', page: 45 }
        ]
      },
      {
        id: 4,
        name: 'सामाजिक अध्ययन',
        code: 'SOC001',
        title: 'सामाजिक अध्ययन कक्षा १०',
        url: `${pdfBase}/Social%20Studies%20Nepali%20Grade%2010.pdf`,
        cover: coverImages.nepali,
        units: [
          { title: 'पाठ १: इतिहास', page: 5 },
          { title: 'पाठ २: भूगोल', page: 15 },
          { title: 'पाठ ३: नागरिक शास्त्र', page: 25 },
          { title: 'पाठ ४: अर्थशास्त्र', page: 35 },
          { title: 'पाठ ५: संस्कृति र समाज', page: 45 }
        ]
      },
      {
        id: 5,
        name: 'कम्प्युटर विज्ञान',
        code: 'COMP001',
        title: 'कम्प्युटर विज्ञान कक्षा १०',
        url: `${pdfBase}/Computer%20Science%20Nepali%20Grade%2010.pdf`,
        cover: coverImages.nepali,
        units: [
          { title: 'पाठ १: प्रोग्रामिंग बेसिक', page: 5 },
          { title: 'पाठ २: डाटा संरचना', page: 15 },
          { title: 'पाठ ३: अल्गोरिदम', page: 25 },
          { title: 'पाठ ४: डाटाबेस प्रबन्धन', page: 35 },
          { title: 'पाठ ५: वेब विकास', page: 45 }
        ]
      },
      {
        id: 6,
        name: 'वैकल्पिक गणित',
        code: 'OPT_MATH',
        title: 'वैकल्पिक गणित कक्षा १०',
        url: `${pdfBase}/Optional%20Mathematics%20Nepali%20Grade%2010.pdf`,
        cover: coverImages.nepali,
        units: [
          { title: 'पाठ १: उन्नत बीजगणित', page: 5 },
          { title: 'पाठ २: क्याल्कुलस', page: 15 },
          { title: 'पाठ ३: भेक्टर', page: 25 },
          { title: 'पाठ ४: म्याट्रिक्स', page: 35 },
          { title: 'पाठ ५: जटिल सङ्ख्या', page: 45 }
        ]
      },
    ]
  };

  const filteredTextbooks = useMemo(() => {
    if (!searchQuery) return textbooks;

    const filtered = {};
    Object.keys(textbooks).forEach(medium => {
      filtered[medium] = textbooks[medium].filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subjectTranslations[medium]?.[book.name]?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    return filtered;
  }, [textbooks, searchQuery]);

  const handleDownload = async (url, index) => {
    try {
      setDownloadingIndex(index);

      if (Platform.OS === 'web') {
        // For web, open the PDF in a new tab
        window.open(url, '_blank');
      } else {
        // For mobile, use the file system
        const filename = url.split('/').pop();
        const fileUri = FileSystem.documentDirectory + filename;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
          await downloadResumable.downloadAsync();
        }

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Download Complete', `File saved to:\n${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Unable to open the file. Please try again.');
    } finally {
      setDownloadingIndex(null);
    }
  };

  const toggleMedium = (medium) => {
    setExpandedMedium(expandedMedium === medium ? null : medium);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        {
          backgroundColor: theme.searchBackground || '#f5f5f5',
          borderColor: theme.border || '#e0e0e0',
        }
      ]}>
        <MaterialIcons
          name="search"
          size={20}
          color={theme.placeholder || '#999'}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={t('searchTextbooks')}
          placeholderTextColor={theme.placeholder || '#999'}
          style={[
            styles.searchInput,
            { color: theme.text }
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons
              name="close"
              size={20}
              color={theme.placeholder || '#999'}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 32 }
        ]}
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
                      {filteredTextbooks[medium]?.length || 0} {t('subjects')}
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name={expandedMedium === medium ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={28}
                  color={theme.text}
                />
              </TouchableOpacity>

              {expandedMedium === medium && filteredTextbooks[medium] && (
                <View style={[
                  styles.subjectsContainer,
                  { backgroundColor: theme.card, borderColor: theme.border }
                ]} >
                  {filteredTextbooks[medium].map((subject, index) => (
                    <View
                      key={subject.id}
                      style={[
                        styles.subjectCard,
                        { borderColor: theme.border, backgroundColor: theme.card }
                      ]}
                    >
                      <Text style={[styles.subjectText, { color: theme.text }]}>
                        {subjectTranslations[medium]?.[subject.name] || subject.name}
                      </Text>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: '/classes/class10/viewer',
                              params: {
                                title: subject.title,
                                url: subject.url,
                                units: JSON.stringify(subject.units || []),
                              },
                            })
                          }
                          style={[
                            styles.button,
                            {
                              backgroundColor: theme.primary,
                              marginRight: 8,
                            }
                          ]}
                        >
                          <Text style={styles.buttonText}>{t('view')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDownload(subject.url, `${medium}-${index}`)}
                          disabled={downloadingIndex === `${medium}-${index}`}
                          style={[
                            styles.button,
                            {
                              backgroundColor: downloadingIndex === `${medium}-${index}`
                                ? theme.disabled || '#cccccc'
                                : theme.secondary || '#666',
                            }
                          ]}
                        >
                          {downloadingIndex === `${medium}-${index}` ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.buttonText}>{t('download')}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Textbook Viewer Component
export function TextbookViewer() {
  const { url, units: unitParam, title } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const parsedUnits = unitParam ? JSON.parse(unitParam) : [];
  const [units] = useState(parsedUnits);
  const [selectedPage, setSelectedPage] = useState(units[0]?.page || 1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFullScreen) {
        setIsFullScreen(false);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isFullScreen]);

  const encodedPdfUrl = encodeURIComponent(url);
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedPdfUrl}#page=${selectedPage}`;

  return (
    <View style={[viewerStyles.container, { backgroundColor: theme.background }]}>
      {/* Back Button - only in fullscreen */}
      {isFullScreen && (
        <TouchableOpacity
          onPress={() => setIsFullScreen(false)}
          style={[viewerStyles.floatingButton, viewerStyles.backButtonFullscreen]}
          accessibilityLabel="Exit fullscreen"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}

      {/* Fullscreen Button - only in normal mode */}
      {!isFullScreen && (
        <TouchableOpacity
          onPress={() => setIsFullScreen(true)}
          style={[viewerStyles.floatingButton, viewerStyles.fullscreenButton, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
          accessibilityLabel="Enter fullscreen"
          activeOpacity={0.8}
        >
          <Ionicons name="expand-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      )}

      {!isFullScreen && (
        <View style={viewerStyles.body}>
          {units.length > 0 && (
            <View style={[viewerStyles.sidebar, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
              <Text style={[viewerStyles.sidebarTitle, { color: theme.text }]}>{title}</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={viewerStyles.scrollContent}>
                {units.map((unit) => {
                  const isSelected = selectedPage === unit.page;
                  return (
                    <TouchableOpacity
                      key={unit.page}
                      onPress={() => setSelectedPage(unit.page)}
                      style={[
                        viewerStyles.unitButton,
                        isSelected && { backgroundColor: theme.primary },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      activeOpacity={0.7}
                    >
                      <Text style={[viewerStyles.unitText, { color: isSelected ? '#fff' : theme.text }]}>
                        {unit.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={[viewerStyles.webViewContainer, { flex: 1 }]}>
            {Platform.OS === 'web' ? (
              <iframe
                title="pdf-viewer"
                src={viewerUrl}
                style={{ width: '100%', height: '100%', border: '0', background: theme.background }}
              />
            ) : (
              <WebView
                source={{ uri: viewerUrl }}
                style={{ flex: 1, backgroundColor: theme.background }}
                startInLoadingState
                renderLoading={() => (
                  <View style={viewerStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={{ color: theme.text, marginTop: 8 }}>Loading PDF...</Text>
                  </View>
                )}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                cacheEnabled
              />
            )}
          </View>
        </View>
      )}

      {isFullScreen && (
        Platform.OS === 'web' ? (
          <iframe
            title="pdf-viewer-fullscreen"
            src={viewerUrl}
            style={{ width: '100%', height: '100%', border: '0', background: theme.background }}
          />
        ) : (
          <WebView
            source={{ uri: viewerUrl }}
            style={{ flex: 1, backgroundColor: theme.background }}
            startInLoadingState
            renderLoading={() => (
              <View style={viewerStyles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.text, marginTop: 8 }}>Loading PDF...</Text>
              </View>
            )}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            cacheEnabled
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  contentContainer: {
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
  subjectCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    marginHorizontal: 8,
    elevation: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  subjectText: {
    fontSize: 17.5,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

const viewerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  sidebar: {
    width: 140,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderColor: '#ddd',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#fafafa',
    elevation: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollContent: {
    paddingVertical: 6,
  },
  unitButton: {
    paddingVertical: 9,
    paddingHorizontal: 1,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  webViewContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    borderRadius: 28,
    padding: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 30,
  },
  backButtonFullscreen: {
    top: 10,
    left: 10,
    backgroundColor: 'gray',
    padding: 8,
  },
  fullscreenButton: {
    top: 16,
    right: 12,
    backgroundColor: '#fff',
  },
})
