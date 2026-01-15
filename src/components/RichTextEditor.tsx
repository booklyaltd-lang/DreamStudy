import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bold, Italic, List, ListOrdered, Link, Image, Video, Code, Upload } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertTag = (tag: string, attributes?: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    let newText = '';
    if (tag === 'img') {
      newText = `${before}<img src="${selectedText ||'url'}" alt="описание" class="w-full rounded-lg my-4" />${after}`;
    } else if (tag === 'video') {
      newText = `${before}<div class="aspect-video my-4"><iframe src="${selectedText || 'https://youtube.com/embed/VIDEO_ID'}" class="w-full h-full rounded-lg" frameborder="0" allowfullscreen></iframe></div>${after}`;
    } else if (tag === 'a') {
      newText = `${before}<a href="${selectedText || 'url'}" class="text-blue-600 hover:underline">${selectedText || 'текст ссылки'}</a>${after}`;
    } else if (tag === 'ul' || tag === 'ol') {
      const items = selectedText.split('\n').filter(l => l.trim());
      const listItems = items.map(item => `  <li>${item.trim()}</li>`).join('\n');
      newText = `${before}<${tag} class="list-disc ml-6 my-4">\n${listItems || '  <li>Элемент списка</li>'}\n</${tag}>${after}`;
    } else {
      newText = `${before}<${tag}${attributes || ''}>${selectedText || 'текст'}</${tag}>${after}`;
    }

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, newText.length - after.length);
    }, 0);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

      if (!allowedFormats.includes(fileExt?.toLowerCase() || '')) {
        alert(`Формат .${fileExt} не поддерживается`);
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Размер изображения не должен превышать 5 МБ');
        return;
      }

      setUploading(true);

      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = value.substring(0, start);
        const after = value.substring(end);
        const newText = `${before}<img src="${publicUrl}" alt="Изображение" class="w-full rounded-lg my-4" />${after}`;
        onChange(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, newText.length - after.length);
        }, 0);
      }
    } catch (error: any) {
      alert('Ошибка загрузки: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderPreview = () => {
    return <div className="prose max-w-none p-4" dangerouslySetInnerHTML={{ __html: value }} />;
  };

  return (
    <div className="space-y-4">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button type="button" onClick={() => insertTag('strong')} className="p-2 hover:bg-gray-200 rounded" title="Жирный">
              <Bold className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => insertTag('em')} className="p-2 hover:bg-gray-200 rounded" title="Курсив">
              <Italic className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button type="button" onClick={() => insertTag('h2', ' class="text-2xl font-bold my-4"')} className="px-3 py-2 hover:bg-gray-200 rounded text-sm font-medium">
              H2
            </button>
            <button type="button" onClick={() => insertTag('h3', ' class="text-xl font-semibold my-3"')} className="px-3 py-2 hover:bg-gray-200 rounded text-sm font-medium">
              H3
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button type="button" onClick={() => insertTag('ul')} className="p-2 hover:bg-gray-200 rounded" title="Список">
              <List className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => insertTag('ol')} className="p-2 hover:bg-gray-200 rounded" title="Нумерованный список">
              <ListOrdered className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button type="button" onClick={() => insertTag('a')} className="p-2 hover:bg-gray-200 rounded" title="Ссылка">
              <Link className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="rich-editor-image-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
              title="Загрузить изображение"
            >
              {uploading ? <Upload className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => insertTag('video')} className="p-2 hover:bg-gray-200 rounded" title="Видео (YouTube)">
              <Video className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => insertTag('code', ' class="bg-gray-100 px-2 py-1 rounded"')} className="p-2 hover:bg-gray-200 rounded" title="Код">
              <Code className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-3 py-1 rounded text-sm ${mode === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Редактор
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded text-sm ${mode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              Превью
            </button>
          </div>
        </div>

        {mode === 'edit' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[400px] p-4 font-mono text-sm resize-y focus:outline-none"
            placeholder="Начните писать контент..."
          />
        ) : (
          <div className="min-h-[400px] bg-white overflow-auto">
            {renderPreview()}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p className="font-medium mb-1">Подсказки:</p>
        <ul className="space-y-1 text-xs">
          <li>• Выделите текст и нажмите кнопку для форматирования</li>
          <li>• Нажмите на иконку изображения для загрузки с компьютера</li>
          <li>• Для YouTube видео используйте формат: https://youtube.com/embed/VIDEO_ID</li>
          <li>• Для HTML кода можно вставить напрямую в режиме редактора</li>
        </ul>
      </div>
    </div>
  );
}
