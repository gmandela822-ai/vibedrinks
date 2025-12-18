const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

export const STORAGE_BUCKET = 'images';

function getUserId(): string | null {
  const saved = localStorage.getItem('vibe-drinks-user');
  if (saved) {
    try {
      const user = JSON.parse(saved);
      return user.id;
    } catch {
      return null;
    }
  }
  return null;
}

export function getStorageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<{ path: string; publicUrl: string }> {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'x-user-id': userId,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  const result = await response.json();
  return {
    path: result.path,
    publicUrl: result.publicUrl
  };
}

export async function deleteImage(path: string): Promise<void> {
  if (!path || path.startsWith('http')) {
    return;
  }
  
  const userId = getUserId();
  if (!userId) {
    console.log('User not authenticated, skipping delete');
    return;
  }

  try {
    const response = await fetch('/api/storage/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to delete image:', error.error);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}
