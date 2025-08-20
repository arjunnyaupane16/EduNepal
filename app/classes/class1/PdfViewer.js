// app/classes/class1/PdfViewer.js
import React from 'react';
import { View, Platform } from 'react-native';
const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;
import { useLocalSearchParams } from 'expo-router';

export default function PdfViewer() {
  const { url } = useLocalSearchParams();

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === 'web' ? (
        <iframe title="pdf-viewer" src={url} style={{ width: '100%', height: '100%', border: '0' }} />
      ) : (
        <WebView source={{ uri: url }} style={{ flex: 1 }} />
      )}
    </View>
  );
}
