import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export async function uploadFile(
  bucket: 'course-images' | 'blog-images' | 'avatars' | 'course-materials',
  file: File,
  path?: string
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = path || `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: filePath
    };
  } catch (error: any) {
    return {
      url: '',
      path: '',
      error: error.message
    };
  }
}

export async function deleteFile(
  bucket: 'course-images' | 'blog-images' | 'avatars' | 'course-materials',
  path: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;

    return {};
  } catch (error: any) {
    return { error: error.message };
  }
}

export function getPublicUrl(
  bucket: 'course-images' | 'blog-images' | 'avatars' | 'course-materials',
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function getPlaceholderImage(width: number = 800, height: number = 600, text?: string): string {
  const displayText = text || `${width}x${height}`;
  return `https://placehold.co/${width}x${height}/3b82f6/ffffff?text=${encodeURIComponent(displayText)}`;
}
