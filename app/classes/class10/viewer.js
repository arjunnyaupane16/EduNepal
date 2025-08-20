import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;
import { useTheme } from '../../context/ThemeContext';

export default function Viewer() {
  const { title, url } = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* PDF View or Error */}
      {url ? (
        Platform.OS === 'web' ? (
          <iframe
            title="pdf-viewer"
            src={url}
            style={{ width: '100%', height: '100%', border: '0' }}
          />
        ) : (
          <WebView
            source={{ uri: url }}
            style={{ flex: 1 }}
            useWebKit
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                color={theme.text}
                style={{ marginTop: 20 }}
              />
            )}
          />
        )
      ) : (
        <View style={styles.errorContainer}>
          <Text style={{ color: theme.text }}>No PDF URL provided.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    padding: 0,
    marginRight: 20,
 
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
