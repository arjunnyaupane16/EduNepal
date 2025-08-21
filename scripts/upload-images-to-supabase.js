// scripts/upload-images-to-supabase.js
// Upload all image assets from assets/images to Supabase Storage under images/
// Uses @supabase/supabase-js (already in dependencies)

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const appConfig = require('../app.json');

const { supabaseUrl, supabaseAnonKey, storageBucket } = appConfig.expo.extra || {};
if (!supabaseUrl || !supabaseAnonKey || !storageBucket) {
  console.error('Missing supabaseUrl, supabaseAnonKey, or storageBucket in app.json -> expo.extra');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const localDir = path.resolve(__dirname, '..', 'assets', 'images');
const targetFolder = 'images';

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

async function uploadFile(fileName) {
  const filePath = path.join(localDir, fileName);
  const ext = path.extname(fileName).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  const fileBuffer = fs.readFileSync(filePath);
  const remotePath = `${targetFolder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .upload(remotePath, fileBuffer, { upsert: true, contentType });

  if (error) throw new Error(`${fileName}: ${error.message}`);
  console.log('Uploaded', fileName, '->', remotePath);
  return data;
}

(async () => {
  try {
    if (!fs.existsSync(localDir)) {
      console.error('Local directory does not exist:', localDir);
      process.exit(1);
    }
    const files = fs
      .readdirSync(localDir)
      .filter((f) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f));

    if (!files.length) {
      console.log('No image files found in', localDir);
      return;
    }

    console.log(`Uploading ${files.length} files to bucket '${storageBucket}' under '${targetFolder}/'...`);
    for (const f of files) {
      try {
        await uploadFile(f);
      } catch (e) {
        console.error('Fail', f, e.message || e);
      }
    }

    console.log('Done. Ensure your bucket/path has public read if images must be publicly accessible.');
    console.log('Example public URL:', `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${targetFolder}/A.png`);
  } catch (e) {
    console.error('Unexpected error:', e?.message || e);
    process.exit(1);
  }
})();
