import { useState, useRef } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { uploadFile } from '../lib/storage';

interface ImageUploaderProps {
  bucket: 'course-images' | 'blog-images' | 'avatars' | 'course-materials';
  currentImage?: string;
  onUploadComplete: (url: string, path: string) => void;
  onUploadStart?: () => void;
  label?: string;
  accept?: string;
}

export function ImageUploader({
  bucket,
  currentImage,
  onUploadComplete,
  onUploadStart,
  label = 'Загрузить изображение',
  accept = 'image/jpeg,image/png,image/webp,image/gif'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);
    setUploading(true);

    if (onUploadStart) {
      onUploadStart();
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const result = await uploadFile(bucket, file);

      if (result.error) {
        setError(result.error);
        setPreview(currentImage || null);
      } else {
        setSuccess(true);
        onUploadComplete(result.url, result.path);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        {preview ? (
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Превью"
              className="w-full h-48 object-cover"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </button>
            {success && (
              <div className="absolute top-2 left-2 p-2 bg-green-600 text-white rounded-full">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP или GIF (макс. 5МБ)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Загрузка...</span>
        </div>
      )}
    </div>
  );
}
