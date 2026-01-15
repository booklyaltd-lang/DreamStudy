import { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Link, Image, Video, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

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
            <button type="button" onClick={() => insertTag('img')} className="p-2 hover:bg-gray-200 rounded" title="Изображение">
              <Image className="h-4 w-4" />
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
          <li>• Для изображения вставьте URL в выделенный текст</li>
          <li>• Для YouTube видео используйте формат: https://youtube.com/embed/VIDEO_ID</li>
          <li>• Для HTML кода можно вставить напрямую в режиме редактора</li>
        </ul>
      </div>
    </div>
  );
}
