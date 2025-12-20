import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ImageBucket = 'products' | 'branding' | 'avatars';

interface UploadOptions {
  bucket: ImageBucket;
  path?: string;
  maxSizeMB?: number;
}

interface UseImageUploadReturn {
  uploadImage: (file: File, options: UploadOptions) => Promise<string | null>;
  deleteImage: (bucket: ImageBucket, path: string) => Promise<boolean>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_MAX_SIZE_MB = 5;

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File, maxSizeMB: number): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Formato não suportado. Use PNG, JPG, WEBP ou GIF.';
    }
    
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
    }
    
    return null;
  };

  const generatePath = (file: File, customPath?: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    if (customPath) {
      return `${customPath}-${timestamp}.${extension}`;
    }
    
    return `${timestamp}-${randomId}.${extension}`;
  };

  const uploadImage = async (
    file: File, 
    { bucket, path, maxSizeMB = DEFAULT_MAX_SIZE_MB }: UploadOptions
  ): Promise<string | null> => {
    setError(null);
    setProgress(0);
    
    const validationError = validateFile(file, maxSizeMB);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      const filePath = generatePath(file, path);
      setProgress(30);

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(80);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      
      return urlData.publicUrl;
    } catch (err: any) {
      const message = err?.message || 'Erro ao fazer upload da imagem';
      setError(message);
      console.error('Upload error:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (bucket: ImageBucket, path: string): Promise<boolean> => {
    try {
      // Extract file path from full URL if needed
      let filePath = path;
      if (path.includes('/storage/v1/object/public/')) {
        const parts = path.split('/storage/v1/object/public/');
        if (parts[1]) {
          // Remove bucket name from path
          const pathWithBucket = parts[1];
          filePath = pathWithBucket.replace(`${bucket}/`, '');
        }
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    progress,
    error,
  };
}
