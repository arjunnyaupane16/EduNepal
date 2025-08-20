import * as FileSystem from 'expo-file-system';

function hashUrl(url) {
  try {
    // In Expo/React Native, crypto may not be available; fallback to simple hash
    const key = url;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  } catch {
    return String(Math.abs(url.length + url.charCodeAt(0)));
  }
}

export async function getOrDownload(url, ext = '') {
  const name = `${hashUrl(url)}${ext ? (ext.startsWith('.') ? ext : `.${ext}`) : ''}`;
  const fileUri = `${FileSystem.cacheDirectory}edunepal/${name}`;
  try {
    // Ensure cache dir
    await FileSystem.makeDirectoryAsync(`${FileSystem.cacheDirectory}edunepal`, { intermediates: true });
  } catch {}

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists && info.size > 0) {
      return { uri: fileUri, fromCache: true };
    }
  } catch {}

  const result = await FileSystem.downloadAsync(url, fileUri);
  return { uri: result.uri, fromCache: false };
}
