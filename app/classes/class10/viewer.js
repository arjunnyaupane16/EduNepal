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
              <Text style={[styles.sidebarTitle, { color: theme.text }]}>{title}</Text>
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
                style={styles.webView}
                allowFullScreen
              />
            ) : (
              <WebView
                source={{ uri: viewerUrl }}
                style={styles.webView}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                )}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                allowFileAccessFromFileURLs={true}
                mixedContentMode="always"
                useWebKit={true}
                scrollEnabled={true}
                bounces={true}
                scalesPageToFit={true}
                automaticallyAdjustContentInsets={true}
                contentInsetAdjustmentBehavior="automatic"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                overScrollMode="always"
                decelerationRate="normal"
                minimumZoomScale={1.0}
                maximumZoomScale={2.0}
                contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
              />
            )}
          </View>
        </View>
      )}

      {isFullScreen && (
        <View style={styles.fullscreenContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              title="pdf-viewer-fullscreen"
              src={`${viewerUrl}&view=FitH`}
              style={styles.fullscreenWebView}
              allowFullScreen
            />
          ) : (
            <WebView
              source={{ uri: `${viewerUrl}&view=FitH` }}
              style={styles.fullscreenWebView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              )}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              allowFileAccessFromFileURLs={true}
              mixedContentMode="always"
              useWebKit={true}
              scrollEnabled={true}
              bounces={true}
              scalesPageToFit={true}
              automaticallyAdjustContentInsets={true}
              contentInsetAdjustmentBehavior="automatic"
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              overScrollMode="always"
              decelerationRate="normal"
              minimumZoomScale={1.0}
              maximumZoomScale={2.0}
              contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
            />
          )}
        </View>
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
  },
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 16,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 4,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  unitText: {
    fontSize: 14,
    lineHeight: 20,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#525659',
  },
  webView: {
    flex: 1,
    borderWidth: 0,
  },
  fullscreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#525659',
  },
  fullscreenWebView: {
    flex: 1,
    borderWidth: 0,
  },
  floatingButton: {
    position: 'absolute',
    zIndex: 1000,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fullscreenButton: {
    top: 16,
    right: 16,
  },
  backButtonFullscreen: {
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#525659',
  },
});
