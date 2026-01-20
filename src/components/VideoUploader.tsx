import { useState } from 'react';
import { Upload, X, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoUploaderProps {
  bucket: string;
  currentVideo?: string;
  onUploadStart?: () => void;
  onUploadComplete: (url: string) => void;
  label?: string;
}

export function VideoUploader({ bucket, currentVideo, onUploadStart, onUploadComplete, label }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('');

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const allowedFormats = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];

      if (!allowedFormats.includes(fileExt?.toLowerCase() || '')) {
        setError(`Формат .${fileExt} не поддерживается. Используйте: ${allowedFormats.join(', ')}`);
        return;
      }

      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('Размер видео не должен превышать 500 МБ');
        return;
      }

      setUploading(true);
      if (onUploadStart) onUploadStart();

      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setProgress(Math.round(percent));
          }
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      setProgress(0);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onUploadComplete('');
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {currentVideo ? (
        <div className="relative border border-gray-300 rounded-lg overflow-hidden">
          <video
            src={currentVideo}
            controls
            className="w-full max-h-64 bg-black"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            disabled={uploading}
            className="hidden"
            id={`video-upload-${bucket}`}
          />
          <label
            htmlFor={`video-upload-${bucket}`}
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="p-3 bg-blue-50 rounded-full mb-3">
              {uploading ? (
                <div className="animate-spin">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
              ) : (
                <Video className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {uploading ? `Загрузка... ${progress}%` : 'Нажмите для загрузки видео'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              MP4, WebM, OGG, MOV (макс. 500 МБ)
            </span>
          </label>
        </div>
      )}

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
