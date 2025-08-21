import Constants from 'expo-constants';

// Build a public URL for a file path inside the Supabase storage bucket.
// Example: publicUrl('class1/My Nepali Grade 1.pdf')
export function publicUrl(path) {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || Constants.manifest?.extra?.supabaseUrl;
  const bucketRaw = Constants.expoConfig?.extra?.storageBucket || Constants.manifest?.extra?.storageBucket;
  if (!supabaseUrl || !bucketRaw) {
    console.warn('Supabase URL or storageBucket missing in app.json extra');
    return path;
  }
  const bucket = encodeURIComponent(bucketRaw);
  // Do not encode the whole path; only encode spaces safely
  const normalizedPath = path.replace(/\\/g, '/');
  const encodedPath = normalizedPath.split('/').map(seg => encodeURIComponent(seg)).join('/');
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}
