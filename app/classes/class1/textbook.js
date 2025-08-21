import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import Constants from 'expo-constants';
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

// Use Supabase-hosted images instead of bundling local PNGs to reduce app size
const SUPABASE_URL = Constants?.expoConfig?.extra?.supabaseUrl || 'https://eovzqcjgqmlaubzwwqpx.supabase.co';
const STORAGE_BUCKET = Constants?.expoConfig?.extra?.storageBucket || 'ElearnNepal';
const imageBase = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/images`;

const coverImages = {
  A: { uri: `${imageBase}/A.png` },
  B: { uri: `${imageBase}/B.png` },
  C: { uri: `${imageBase}/C.png` },
  D: { uri: `${imageBase}/D.png` },
  E: { uri: `${imageBase}/E.png` },
  F: { uri: `${imageBase}/F.png` },
  G: { uri: `${imageBase}/G.png` },
};

export default function Textbook() {
  const { theme } = useTheme();
  const router = useRouter();
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const textbooks = [
    {
      title: 'दोस्रो भाषाका रूपमा नेपाली भाषा सिकाइका लागि शिक्षण स्रोतसामग्री',
      url: 'https://hnfwgeqypfyfvdjlroqy.supabase.co/storage/v1/object/public/class1//Teaching%20resources%20for%20learning%20Nepali%20as%20a%20second%20language%20(1).pdf',
      cover: coverImages.A,
      units: [
        { title: '१. परिचय', page: 5 },
        { title: '२. दोस्रो भाषाका रूपमा नेपाली शिक्षण गर्दा सन्दर्भपृष्ठका केही पक्ष', page: 8 },
        { title: '३. भाषिक स्थितिको पहिचान', page: 10 },
        { title: '४. उच्चारण', page: 13 },
        { title: '५. संरचना र सञ्झालि', page: 27 },
        { title: '६. बोध', page: 36 },
        { title: '७. पठन प्रवाह', page: 44 },
        { title: '८. अभिव्यक्ति', page: 46 }
      ]

    },
    {
      title: 'मेरो नेपाली - कक्षा १',
      url: 'https://hnfwgeqypfyfvdjlroqy.supabase.co/storage/v1/object/public/class1//My%20Nepali%20Grade%201.pdf',
      cover: coverImages.B,
      units: [
        { title: 'पाठ १: म र मेरो परिवार', page: 7 },
        { title: '२: हाम्रो स्वास्थ्य', page: 21 },
        { title: '३: हाम्रो समुदाय', page: 33 },
        { title: '४: हाम्रो विद्यालय', page: 45 },
        { title: '५: हाम्रा वरपरका जीवजन्तु', page: 55 },
        { title: '६: हाम्रो वातावरण', page: 71 },
        { title: '७: हाम्रो सिर्जना', page: 89 },
        { title: '८: हाम्रो संस्कृति', page: 107 },
        { title: '९: सन्देश, प्रविधि र बजार', page: 145 },
        { title: '१०: हाम्रो वरपरको संसार', page: 159 }
      ]




    },
    {
      title: 'My English Grade 1',
      url: 'https://hnfwgeqypfyfvdjlroqy.supabase.co/storage/v1/object/public/class1/book3_mero_english.pdf',
      cover: coverImages.C,
      units: [
        { title: 'Unit 1: Me and My Family', page: 8 },
        { title: ' 2: Alphabet (Aa-Zz)', page: 38 },
        { title: ' 3: Me and My Family (Revisited)', page: 156 },
        { title: ' 4: My Daily Life', page: 160 },
        { title: ' 5: My School', page: 172 },
        { title: ' 6: Our Environment', page: 184 },
        { title: ' 7: My Belongings', page: 194 },
        { title: ' 8: Our Culture', page: 204 },
        { title: ' 9: Communication & Market', page: 210 },
        { title: ' 10: Fruits and Vegetables', page: 218 },
        { title: ' 11: Hobbies and Interests', page: 226 },
        { title: ' 12: Birds and Animals', page: 232 },
      ],
    },
    {
      title: 'मेरो गणित (आत्म-अध्ययन सामग्री) कक्षा १',
      url: 'https://hnfwgeqypfyfvdjlroqy.supabase.co/storage/v1/object/public/class1//My%20Mathematics%20(Self%20-%20Learning%20Material)%20Grade%20-%201.pdf',
      cover: coverImages.D,
      units: [
        { title: 'पाठ १: आकार, प्रकार र स्थान', page: 11 },
        { title: ' २: रेखाहरू', page: 16 },
        { title: ' ३: ज्यामितीय आकृतिहरू', page: 20 },
        { title: ' ४: १ देखि ९ सम्मका सङ्ख्या', page: 25 },
        { title: ' ५: शून्य', page: 43 },
        { title: ' ६: दश', page: 48 },
        { title: ' ७: योगफल १० सम्म आउने जोड', page: 55 },
        { title: ' ८: १० सम्म सङ्ख्याका घटाउ', page: 73 },
        { title: ' ९: ११ देखि २० सम्मका सङ्ख्या', page: 92 },
        { title: ' १०: योगफल २० सम्म आउने जोड', page: 102 },
        { title: ' ११: २० सम्मका सङ्ख्याका घटाउ', page: 114 },
        { title: ' १२: जोर र बिजोर सङ्ख्या', page: 125 },
        { title: ' १३: २० सम्मका सङ्ख्या अक्षरमा', page: 129 },
        { title: ' १४: क्रमागत सङ्ख्या', page: 131 },
        { title: ' १५: २१ देखि ५० सम्मका सङ्ख्या', page: 135 },
        { title: ' १६: योगफल १०० सम्म आउने जोड', page: 151 },
        { title: ' १७: दुई अङ्कसम्मको सङ्ख्याका घटाउ', page: 157 },
        { title: ' १८: १०० सम्मका हिन्दु-अङ्किका सङ्ख्याहरू', page: 163 },
        { title: ' १९: समय', page: 165 },
        { title: ' २०: सिक्का र नोटहरू', page: 171 },
        { title: ' २१: तौल', page: 175 },
        { title: ' २२: चित्रग्राफ', page: 178 }

      ]
    },
    {
      title: 'मेरो गणित - कक्षा १',
      url: 'https://hnfwgeqypfyfvdjlroqy.supabase.co/storage/v1/object/public/class1//MY%20Mathematics%20Grade%201.pdf',
      cover: coverImages.E,
      units: [
        { title: ' १: आकार प्रकार र स्थान', page: 7 },
        { title: ' २: रेखाहरू', page: 19 },
        { title: ' ३: ज्यामितीय आकारहरू', page: 23 },
        { title: ' ४: ९ सम्मका सङ्ख्याहरू', page: 33 },
        { title: ' ५: शून्य', page: 51 },
        { title: ' ६: दश', page: 56 },
        { title: ' ७: योगफल १० सम्म आउने जोड', page: 62 },
        { title: ' ८: १० सम्मका सङ्ख्याहरूको घटाउ', page: 81 },
        { title: ' ९: ११ देखि २० सम्मका सङ्ख्याहरू', page: 99 },
        { title: ' १०: योगफल २० सम्म आउने जोड', page: 111 },
        { title: ' ११: २० सम्मका सङ्ख्याहरूको घटाउ', page: 121 },
        { title: ' १२: जोर र बिजोर सङ्ख्याहरू', page: 132 },
        { title: ' १३: २० सम्मका सङ्ख्याहरू अक्षरमा', page: 134 },
        { title: ' १४: क्रमागत सङ्ख्याहरू', page: 136 },
        { title: ' १५: २१ देखि १०० सम्मका सङ्ख्याहरू', page: 142 },
        { title: ' १६: योगफल १०० सम्म आउने जोड', page: 156 },
        { title: ' १७: दुई अङ्कसम्मका सङ्ख्याहरूको घटाउ', page: 163 },
        { title: ' १८: १०० सम्मका हिन्दु अरेबिक सङ्ख्याहरू', page: 169 },
        { title: ' १९: समय', page: 174 },
        { title: ' २०: सिक्का र नोटहरू', page: 178 },
        { title: ' २१: लम्बाइ', page: 189 },
        { title: ' २२: चित्रग्राफ', page: 194 }
      ]

    },
    {
      title: 'My Mathematics (English Translation) - Grade 1',
      url: 'https://hnfwgeqypfyfvdjlroqy.supabase.co/storage/v1/object/public/class1//My%20Mathematics%20-%20Grade%201%20(English%20Translation).pdf',
      cover: coverImages.F,
      units: [
        { title: ' 1: Shape and Size, and Space', page: 7 },
        { title: ' 2: Lines', page: 19 },
        { title: ' 3: Geometric Shapes', page: 23 },
        { title: ' 4: Numbers up to 9', page: 33 },
        { title: ' 5: Zero', page: 49 },
        { title: ' 6: Ten', page: 54 },
        { title: ' 7: Addition up to 10', page: 60 },
        { title: ' 8: Subtraction up to 10', page: 79 },
        { title: ' 9: Numbers 11-20', page: 97 },
        { title: ' 10: Addition up to 20', page: 109 },
        { title: ' 11: Subtraction up to 20', page: 119 },
        { title: ' 12: Odd and Even Numbers', page: 128 },
        { title: ' 13: Number Names up to 20', page: 132 },
        { title: ' 14: Ordinal Numbers', page: 134 },
        { title: ' 15: Numbers 21-100', page: 140 },
        { title: ' 16: Addition up to 100', page: 154 },
        { title: ' 17: Two-digit Subtraction', page: 161 },
        { title: ' 18: Devanagari Numerals up to 100', page: 167 },
        { title: ' 19: Time', page: 180 },
        { title: ' 20: Coins and Notes', page: 184 },
        { title: ' 21: Length', page: 189 },
        { title: ' 22: Pictograph', page: 194 }
      ]

    },
    {
      title: 'हाम्रो सेरोफेरो-कक्षा १',
      url: 'https://hnfwgeqypfyfvdjlroqy.supabase.co/storage/v1/object/public/class1//Hamro%20Serophero%20Grade%201.pdf',
      cover: coverImages.G,
      units: [
        { title: 'पाठ १: म र मेरो परिवार', page: 6 },
        { title: ' २: हाम्रो स्वास्थ्य', page: 35 },
        { title: ' ३: हाम्रो समुदाय', page: 65 },
        { title: ' ४: हाम्रो विद्यालय', page: 90 },
        { title: ' ५: हाम्रा वरपरका जीवजन्तु', page: 117 },
        { title: ' ६: हाम्रो वातावरण', page: 133 },
        { title: ' ७: हाम्रो सिर्जना', page: 150 },
        { title: ' ८: हाम्रो संस्कृति', page: 170 },
        { title: ' ९: सन्देश, प्रविधि र बजार', page: 182 },
        { title: ' १०: हाम्रो वरपरको संसार', page: 200 }
      ]


    },

  ];

  const filteredTextbooks = useMemo(() => {
    if (!searchQuery) return textbooks;
    return textbooks.filter(book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [textbooks, searchQuery]);

  const handleDownload = async (url, index) => {
    try {
      setDownloadingIndex(index);
      const filename = url.split('/').pop();
      const fileUri = FileSystem.documentDirectory + filename;

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
        await downloadResumable.downloadAsync();
      }
      setDownloadingIndex(null);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Download Complete', `File saved to:\n${fileUri}`);
      }
    } catch (error) {
      setDownloadingIndex(null);
      Alert.alert('Download Failed', 'Unable to download the file.');
    }
  };

  return (
    <View style={[localStyles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={[
        localStyles.searchContainer,
        {
          backgroundColor: theme.searchBackground || '#f5f5f5',
          borderColor: theme.border || '#e0e0e0',
        }
      ]}>
        <MaterialIcons
          name="search"
          size={20}
          color={theme.placeholder || '#999'}
          style={localStyles.searchIcon}
        />
        <TextInput
          placeholder="Search textbooks..."
          placeholderTextColor={theme.placeholder || '#999'}
          style={[
            localStyles.searchInput,
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
          localStyles.contentContainer,
          { paddingBottom: 32 }
        ]}
      >
        <Text style={[localStyles.header, { color: theme.text }]}>
          Class 1 Textbooks & Resources
        </Text>

        {filteredTextbooks.length === 0 ? (
          <View style={localStyles.emptyState}>
            <MaterialIcons
              name="search-off"
              size={40}
              color={theme.placeholder || '#999'}
            />
            <Text style={[localStyles.emptyText, { color: theme.secondaryText }]}>
              No textbooks found matching "{searchQuery}"
            </Text>
          </View>
        ) : (
          filteredTextbooks.map((book, i) => (
            <View
              key={i}
              style={[
                localStyles.card,
                {
                  backgroundColor: theme.cardBackground || '#fff',
                  borderColor: theme.border || '#e0e0e0',
                }
              ]}
            >
              <View style={localStyles.bookContainer}>
                <Image
                  source={book.cover}
                  style={localStyles.bookCover}
                  resizeMode="cover"
                />
                <View style={localStyles.bookInfo}>
                  <Text
                    style={[localStyles.title, { color: theme.text }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {book.title}
                  </Text>

                  <View style={localStyles.actions}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/classes/class1/viewer',
                          params: {
                            title: book.title,
                            url: book.url,
                            units: JSON.stringify(book.units || []),
                          },
                        })
                      }
                      style={[
                        localStyles.button,
                        {
                          backgroundColor: theme.primary,
                          flex: 1,
                        }
                      ]}
                    >
                      <Text style={localStyles.buttonText}>View</Text>
                    </TouchableOpacity>

                    <View style={{ width: 12 }} />

                    <TouchableOpacity
                      onPress={() => handleDownload(book.url, i)}
                      disabled={downloadingIndex === i}
                      style={[
                        localStyles.button,
                        {
                          backgroundColor: downloadingIndex === i
                            ? theme.disabled || '#cccccc'
                            : theme.secondary || '#666',
                          flex: 1,
                        }
                      ]}
                    >
                      {downloadingIndex === i ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={localStyles.buttonText}>Download</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
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
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  bookCover: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
