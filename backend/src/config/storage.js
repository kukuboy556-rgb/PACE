const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const USE_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

let supabase;
if (USE_SUPABASE) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'pace-uploads';
const LOCAL_DIR = process.env.UPLOAD_DIR || './uploads';

async function upload(filename, buffer, mimetype) {
  if (USE_SUPABASE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: mimetype,
        upsert: true,
      });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);
    return { url: publicUrl, filename };
  }

  const filePath = path.join(LOCAL_DIR, filename);
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, buffer);
  return { url: '/uploads/' + filename, filename };
}

async function remove(filename) {
  if (USE_SUPABASE) {
    await supabase.storage.from(BUCKET).remove([filename]);
    return;
  }
  const filePath = path.join(LOCAL_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = { upload, remove, USE_SUPABASE };
