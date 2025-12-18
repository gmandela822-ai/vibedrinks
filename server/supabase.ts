import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('Supabase credentials not configured. Storage features will be disabled.');
}

export { supabaseAdmin };

export const STORAGE_BUCKET = 'images';

export function getStorageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export function getPublicUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (!supabaseAdmin) {
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
  }
  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<{ path: string; publicUrl: string }> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured. Storage features are disabled.');
  }
  const uniqueFileName = `${folder}/${randomUUID()}-${fileName}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(uniqueFileName, file, {
      contentType,
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const publicUrl = getPublicUrl(data.path);
  
  return {
    path: data.path,
    publicUrl
  };
}

export async function deleteFile(path: string): Promise<void> {
  if (!path || path.startsWith('http')) {
    return;
  }
  if (!supabaseAdmin) {
    console.warn('Supabase is not configured. Cannot delete file.');
    return;
  }
  
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error(`Failed to delete file: ${error.message}`);
  }
}

export async function createSignedUploadUrl(folder: string = 'uploads'): Promise<{
  signedUrl: string;
  path: string;
  token: string;
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured. Storage features are disabled.');
  }
  const fileName = `${folder}/${randomUUID()}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(fileName);

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token
  };
}
