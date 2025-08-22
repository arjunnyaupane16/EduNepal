// scripts/upload-images-to-supabase.js
// Upload all image assets from assets/images to Supabase Storage under images/
// Uses @supabase/supabase-js (already in dependencies)
// Loads env from project .env automatically

try { require('dotenv').config(); } catch {}
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const appConfig = require('../app.json');

const { supabaseUrl, supabaseAnonKey, storageBucket } = appConfig.expo.extra || {};
// Prefer service role key for server-side uploads to bypass RLS safely.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || (!supabaseAnonKey && !serviceRoleKey) || !storageBucket) {
  console.error('Missing supabaseUrl, storageBucket, or keys (set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY env, or provide supabaseAnonKey in app.json with proper RLS)');
  process.exit(1);
}

const keyUsed = serviceRoleKey || supabaseAnonKey;
if (serviceRoleKey) {
  console.log('Using service key from environment for uploads (SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY).');
} else {
  console.log('Using anon key from app.json for uploads (ensure RLS insert policy exists).');
}
const supabase = createClient(supabaseUrl, keyUsed);
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
