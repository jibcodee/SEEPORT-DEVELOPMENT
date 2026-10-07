const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync('C:/Users/kio/Desktop/SEEPORT_DEVELOPMENT/theme-store-next/.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) process.env[key.trim()] = values.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile() {
  const filePath = 'C:/Users/kio/Desktop/SEEPORT_DEVELOPMENT/nasilemak.svg';
  const fileName = `nasilemak_${Date.now()}.svg`;
  const bucketName = 'assets';

  try {
    // Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;
    
    const bucketExists = buckets.find(b => b.name === bucketName);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist (assuming anon key has permissions, which it might not, but let's try)
      const { data, error } = await supabase.storage.createBucket(bucketName, { public: true });
      if (error) {
        console.warn('Could not create bucket (maybe permissions issue), will try to upload anyway:', error.message);
      }
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log('UPLOAD SUCCESS');
    console.log('Public URL:', publicUrlData.publicUrl);
    
  } catch (err) {
    console.error('UPLOAD FAILED:', err);
  }
}

uploadFile();
