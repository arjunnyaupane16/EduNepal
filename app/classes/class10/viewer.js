import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;
import { useTheme } from '../../context/ThemeContext';

export default function TextbookViewer() {
  const { url, units: unitParam } = useLocalSearchParams();
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Back Button - only in fullscreen */}
      {isFullScreen && (
        <TouchableOpacity
          onPress={() => setIsFullScreen(false)}
          style={[styles.floatingButton, styles.backButtonFullscreen]}
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
          style={[styles.floatingButton, styles.fullscreenButton, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
          accessibilityLabel="Enter fullscreen"
          activeOpacity={0.8}
        >
          <Ionicons name="expand-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      )}

      {!isFullScreen && (
        <View style={styles.body}>
          {units.length > 0 && (
            <View style={[styles.sidebar, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {units.map((unit) => {
                  const isSelected = selectedPage === unit.page;
                  return (
                    <TouchableOpacity
                      key={unit.page}
                      onPress={() => setSelectedPage(unit.page)}
                      style={[
                        styles.unitButton,
                        isSelected && { backgroundColor: theme.primary },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.unitText, { color: isSelected ? '#fff' : theme.text }]}>
                        {unit.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={[styles.webViewContainer, { flex: 1 }]}>
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
                  <View style={styles.loadingContainer}>
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
              <View style={styles.loadingContainer}>
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

  body: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },

  sidebar: {
    width: 115,
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

  scrollContent: {
    paddingVertical: 6,
  },

  unitButton: {
    paddingVertical: 9,
    paddingHorizontal:1,
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
    top:12,
    left: 0,
    backgroundColor: 'gray',
    padding: 8,
  },

  fullscreenButton: {
    top: 12,
    right: 12,
    size:20,
    backgroundColor: '#fff',
  },
});
