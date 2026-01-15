import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploader } from './ImageUploader';
import { VideoUploader } from './VideoUploader';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function generateSlug(title: string): string {
  const translitMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  return title
    .toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface BlogEditorProps {
  post?: any;
  onClose: () => void;
}

export function BlogEditor({ post, onClose }: BlogEditorProps) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content_html: post?.content_html || '',
    cover_image_url: post?.cover_image_url || '',
    category: post?.category || 'Обучение',
    required_tier: post?.required_tier || 'free',
    video_url: post?.video_url || '',
    video_type: post?.video_type || 'youtube',
    is_published: post?.is_published || false
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const dataToSave = {
        ...formData,
        author_id: user?.id,
        published_at: formData.is_published && !post ? new Date().toISOString() : post?.published_at
      };

      if (post) {
        const { error } = await supabase
          .from('blog_posts')
          .update(dataToSave)
          .eq('id', post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([dataToSave]);
        if (error) throw error;
      }
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {post ? 'Редактировать статью' : 'Создать статью'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Заголовок</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                const slug = generateSlug(title);
                setFormData({ ...formData, title, slug });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">URL (slug)</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Краткое описание</label>
            <textarea
              required
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
            <select
              value={formData.is_published ? 'published' : 'draft'}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'published' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Доступ</label>
            <select
              value={formData.required_tier}
              onChange={(e) => setFormData({ ...formData, required_tier: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Бесплатно</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="col-span-2">
            <ImageUploader
              bucket="blog-images"
              currentImage={formData.cover_image_url}
              onUploadStart={() => setUploadingImage(true)}
              onUploadComplete={(url) => {
                setFormData({ ...formData, cover_image_url: url });
                setUploadingImage(false);
              }}
              label="Обложка статьи"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Видео (опционально)</label>
            <div className="space-y-4">
              <select
                value={formData.video_type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFormData({
                    ...formData,
                    video_type: newType,
                    video_url: newType === 'upload' ? formData.video_url : ''
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="upload">Загрузить файл</option>
                <option value="html">HTML Embed</option>
              </select>

              {formData.video_type === 'upload' ? (
                <VideoUploader
                  bucket="blog-videos"
                  currentVideo={formData.video_url}
                  onUploadStart={() => setUploadingVideo(true)}
                  onUploadComplete={(url) => {
                    setFormData({ ...formData, video_url: url });
                    setUploadingVideo(false);
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="URL видео или HTML код"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          <div className="col-span-2">
            <RichTextEditor
              value={formData.content_html}
              onChange={(value) => setFormData({ ...formData, content_html: value })}
              label="Содержимое статьи"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving || uploadingImage || uploadingVideo}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Сохранение...' : (uploadingImage || uploadingVideo) ? 'Ожидание загрузки...' : post ? 'Обновить' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  );
}
