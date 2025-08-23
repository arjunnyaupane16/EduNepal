import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Platform } from 'react-native';

// PDFs are now hosted in a separate Supabase project/bucket
const PDF_SUPABASE_URL = Constants?.expoConfig?.extra?.pdfSupabaseUrl || 'https://apqysgfnanmvkracjgtr.supabase.co';
const PDF_STORAGE_BUCKET = Constants?.expoConfig?.extra?.pdfStorageBucket || 'Arjun Nyaupane';
const pdfBase = `${PDF_SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(PDF_STORAGE_BUCKET)}`;

const englishUnits = [
  {
    title: 'Unit 1: Current Affairs and Issues',
    url: `${pdfBase}/Class%2010%20English%20Unit%201Exercise.pdf`,
  },
  {
    title: 'Unit 2: Festivals And Celebrations',
    url: `${pdfBase}/English%20Unit%202.pdf`,
  },
  {
    title: 'Unit 3: Health & Wellness',
    url: `${pdfBase}/English%20Unit%203.pdf`,
  },
  {
    title: 'Unit 4: Work & Leisure',
    url: `${pdfBase}/Unit%204%20English.pdf`,
  },
  {
    title: 'Unit 5: Science & Experiments',
    url: `${pdfBase}/English%20Unit%205.pdf`,
  },
  {
    title: 'Unit 6: Food & Cuisine',
    url: `${pdfBase}/Unit%206%20english.pdf`,
  },
  {
    title: 'Unit 7: Cyber Security',
    url: `${pdfBase}/Unit%207%20Cyber%20Security%20Exercise.pdf`,
  },
  {
    title: 'Unit 8: Hobbies & Interest',
    url: `${pdfBase}/Unit%208%20English.pdf`,
  },
  {
    title: 'Unit 9: History & Culture',
    url: `${pdfBase}/Unit%209%20English.pdf`,
  },
  {
    title: 'Unit 10: Games & Sports',
    url: `${pdfBase}/Unit%2010English.pdf`,
  },
  {
    title: 'Unit 11: Ethics & Morality',
    url: `${pdfBase}/Unit%2011%20Englishl.pdf`,
  },
  {
    title: 'Unit 12: Nature & Development',
    url: `${pdfBase}/Unit%2012%20English.pdf`,
  },
  {
    title: 'Unit 13: Population & Migration',
    url: `${pdfBase}/Unit%2013%20English.pdf`,
  },
  {
    title: 'Unit 14: Travel & Adventure',
    url: `${pdfBase}/Unit%2014%20English.pdf`,
  },
  {
    title: 'Unit 15: People & Places',
    url: `${pdfBase}/Unit%2015%20English.pdf`,
  },
  {
    title: 'Unit 16: Success & Celebration',
    url: `${pdfBase}/Unit%2016%20Englishh.pdf`,
  },
  {
    title: 'Unit 17: Countries & Towns',
    url: `${pdfBase}/Unit%2017%20Englishh.pdf`,
  },
  {
    title: 'Unit 18: Media & Entertainment',
    url: `${pdfBase}/Unit%2018%20English.pdf`,
  },
];

export default function EnglishGuidebook() {
  const { theme } = useTheme();
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      checkAllDownloads();
    }
  }, []);

  const checkAllDownloads = async () => {
    try {
      const results = [];
      for (let unit of englishUnits) {
        const fileName = unit.title.replace(/\s+/g, '_') + '.pdf';
        const fileUri = FileSystem.documentDirectory + fileName;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) results.push(unit.title);
      }
      setDownloadedFiles(results);
    } catch (error) {
      console.error('Error checking downloads:', error);
    }
  };

  const handleDownloadOrDelete = async (title, url) => {
    // For web, open the PDF in a new tab
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
      return;
    }

    // For mobile, handle download/delete
    const fileName = title.replace(/\s+/g, '_') + '.pdf';
    const fileUri = FileSystem.documentDirectory + fileName;
    const isDownloaded = downloadedFiles.includes(title);

    if (isDownloaded) {
      Alert.alert(
        'Delete Download',
        'Are you sure you want to delete this downloaded file?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                setDownloadedFiles(prev => prev.filter(name => name !== title));
              } catch (err) {
                console.error('Delete error:', err);
                Alert.alert('Error', 'Failed to delete the file. Please try again.');
              }
            },
          },
        ]
      );
      return;
    }

    try {
      setDownloading(title);
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri);
        }
        setDownloadedFiles(prev => [...prev, title]);
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download the file. Please check your connection and try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <Text style={[styles.title, { color: theme.text }]}>
        📘 Class 10 English Guidebook
      </Text>
      <View style={styles.unitList}>
        {englishUnits.map((unit, index) => {
          const isDownloaded = downloadedFiles.includes(unit.title);
          const isDownloading = downloading === unit.title;

          return (
            <View
              key={index}
              style={[
                styles.card,
                { backgroundColor: theme.card, shadowColor: theme.text },
              ]}
            >
              <View style={styles.unitRow}>
                <Text style={[styles.unitTitle, { color: theme.text }]}>
                  {unit.title}
                </Text>
                <View style={styles.smallButtons}>
                  <TouchableOpacity
                    style={[
                      styles.smallBtn,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/classes/class10/viewer',
                        params: { title: unit.title, url: unit.url },
                      })
                    }
                  >
                    <Text style={styles.smallBtnText}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.smallBtn,
                      {
                        backgroundColor: isDownloaded
                          ? theme.primary
                          : theme.secondary,
                      },
                    ]}
                    onPress={() => handleDownloadOrDelete(unit.title, unit.url)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator color="#fff" size={14} />
                    ) : (
                      <Text style={styles.smallBtnText}>
                        {isDownloaded ? '✔' : '↓'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    padding: 16,
    textAlign: 'center',
  },
  unitList: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  card: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitTitle: {
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1,
    color: 'red'
  },
  smallButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
