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
const PDF_SUPABASE_URL =
  Constants?.expoConfig?.extra?.pdfSupabaseUrl || 'https://apqysgfnanmvkracjgtr.supabase.co';
const PDF_STORAGE_BUCKET =
  Constants?.expoConfig?.extra?.pdfStorageBucket || 'Arjun Nyaupane';
const pdfBase = `${PDF_SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(PDF_STORAGE_BUCKET)}`;

const nepaliUnits = [
  { title: 'पाठ 1: उज्यालो यात्रा', url: `${pdfBase}/1.pdf` },
  { title: 'पाठ 2: घरझगडा', url: `${pdfBase}/2.pdf` },
  { title: 'पाठ 3: चिकित्सा विज्ञान र आयुर्वेद चिकित्सा', url: `${pdfBase}/3.pdf` },
  { title: 'पाठ 4: यस्तो कहिल्यै नहोस्', url: `${pdfBase}/4.pdf` },
  { title: 'पाठ 5: लक्ष्मीप्रसाद देवकोटा', url: `${pdfBase}/5.pdf` },
  { title: 'पाठ 6: अधिकार ठुलो कि कर्तब्य ठुलो ?', url: `${pdfBase}/6.pdf` },
  { title: 'पाठ 7: शत्रु', url: `${pdfBase}/7.pdf` },
  { title: 'पाठ 8: नेपाली हाम्रो श्रम र सिप', url: `${pdfBase}/8.pdf` },
  { title: 'पाठ 9: मेरो देश को शिक्षा', url: `${pdfBase}/9.pdf` },
  { title: 'पाठ 10: व्यावसायिक चिठी', url: `${pdfBase}/10.pdf` },
  { title: 'पाठ 11: कर्तव्य', url: `${pdfBase}/11.pdf` },
  { title: 'पाठ 12: पाब्लो पिकासो', url: `${pdfBase}/12.pdf` },
  { title: 'पाठ 13: पख्नोस', url: `${pdfBase}/13.pdf` },
  { title: 'पाठ 14: घरको माया', url: `${pdfBase}/14.pdf` },
  { title: 'पाठ 15: गाउँमाथि एउटा कविता', url: `${pdfBase}/15.pdf` },
  { title: 'पाठ 16: आयाम', url: `${pdfBase}/16.pdf` },
];

export default function NepaliGuidebook() {
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
      for (let unit of nepaliUnits) {
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
        📘 कक्षा १० नेपाली मार्गदर्शिका
      </Text>
      <View style={styles.unitList}>
        {nepaliUnits.map((unit, index) => {
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
    color: 'red',
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
