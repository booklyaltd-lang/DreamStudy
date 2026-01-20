import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Facebook, Twitter, Linkedin, Instagram, Youtube, Send, Mail, MessageCircle, Phone } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { supabase } from '../lib/supabase';

interface SocialLink {
  platform: string;
  url: string;
}

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'twitter', label: 'Twitter (X)', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'telegram', label: 'Telegram', icon: Send },
  { value: 'vk', label: 'ВКонтакте', icon: MessageCircle },
  { value: 'whatsapp', label: 'WhatsApp', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
];

export function SettingsEditor() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { refreshSettings } = useSiteSettings();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          ...data,
          social_links: data.social_links || [],
          about_features: data.about_features || ['Обучение в удобном темпе', 'Сертификаты о прохождении', 'Поддержка экспертов', 'Практические проекты']
        });
      } else {
        setSettings({
          site_name: 'EduPlatform',
          logo_url: '',
          hero_badge_text: 'Преобразите свою карьеру с курсами от экспертов',
          hero_title: 'Учитесь онлайн в удобном темпе',
          hero_description: 'Получите доступ к тысячам экспертных курсов и улучшите свои навыки',
          hero_cta_text: 'Начать обучение',
          hero_background_color: '#3b82f6',
          hero_background_opacity: 1.0,
          footer_description: 'Расширяем возможности учащихся по всему миру с помощью качественных онлайн-курсов и образовательного контента.',
          about_title: 'О нашей платформе',
          about_description: 'Мы создаем современное образовательное пространство, где каждый может найти курсы для развития своих навыков и достижения целей.',
          about_image_url: '',
          about_features: ['Обучение в удобном темпе', 'Сертификаты о прохождении', 'Поддержка экспертов', 'Практические проекты'],
          cta_card_title: 'Начните сегодня',
          cta_card_subtitle: 'И измените свое будущее',
          social_links: [],
          site_tagline: '',
          meta_description: '',
          og_image_url: '',
          og_title: '',
          og_description: ''
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([settings]);

        if (error) throw error;
      }

      setSuccess('Настройки успешно сохранены');
      await refreshSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    setSettings({
      ...settings,
      social_links: [...settings.social_links, { platform: SOCIAL_PLATFORMS[0].value, url: '' }]
    });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = settings.social_links.filter((_: any, i: number) => i !== index);
    setSettings({ ...settings, social_links: newLinks });
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...settings.social_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setSettings({ ...settings, social_links: newLinks });
  };

  const addFeature = () => {
    setSettings({
      ...settings,
      about_features: [...settings.about_features, '']
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = settings.about_features.filter((_: any, i: number) => i !== index);
    setSettings({ ...settings, about_features: newFeatures });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...settings.about_features];
    newFeatures[index] = value;
    setSettings({ ...settings, about_features: newFeatures });
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка настроек...</div>;
  }

  if (!settings) {
    return <div className="text-center py-8 text-red-600">Ошибка загрузки настроек</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Настройки сайта</h2>
          <p className="text-sm text-gray-600 mt-1">Управление основными параметрами платформы</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Основные настройки</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Название сайта</label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <ImageUploader
            bucket="site-assets"
            currentImage={settings.logo_url}
            onUploadStart={() => setUploading(true)}
            onUploadComplete={(url) => {
              setSettings({ ...settings, logo_url: url });
              setUploading(false);
            }}
            label="Логотип сайта"
          />
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SEO и социальные сети</h3>
          <p className="text-sm text-gray-600 mt-1">Настройки для поисковой оптимизации и отображения ссылок в социальных сетях</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Слоган сайта
          </label>
          <input
            type="text"
            value={settings.site_tagline || ''}
            onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Знания, как инструмент мышления"
          />
          <p className="text-xs text-gray-500 mt-1">
            Будет отображаться в заголовке страницы: "Название сайта. Слоган"
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание для поисковых систем
          </label>
          <textarea
            rows={2}
            value={settings.meta_description || ''}
            onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Краткое описание сайта для поисковых систем и социальных сетей"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок для социальных сетей (опционально)
          </label>
          <input
            type="text"
            value={settings.og_title || ''}
            onChange={(e) => setSettings({ ...settings, og_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Если не указано, используется название + слоган"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание для социальных сетей (опционально)
          </label>
          <textarea
            rows={2}
            value={settings.og_description || ''}
            onChange={(e) => setSettings({ ...settings, og_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Если не указано, используется описание для поисковых систем"
          />
        </div>

        <div>
          <ImageUploader
            bucket="site-assets"
            currentImage={settings.og_image_url || ''}
            onUploadStart={() => setUploading(true)}
            onUploadComplete={(url) => {
              setSettings({ ...settings, og_image_url: url });
              setUploading(false);
            }}
            label="Изображение для социальных сетей"
          />
          <p className="text-xs text-gray-500 mt-1">
            Рекомендуемый размер: 1200x630 пикселей. Это изображение будет отображаться при публикации ссылки на сайт в социальных сетях.
          </p>
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Главная страница (Hero)</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Текст бейджа</label>
          <input
            type="text"
            value={settings.hero_badge_text}
            onChange={(e) => setSettings({ ...settings, hero_badge_text: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Преобразите свою карьеру с курсами от экспертов"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Заголовок</label>
          <input
            type="text"
            value={settings.hero_title}
            onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
          <textarea
            rows={3}
            value={settings.hero_description}
            onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Текст кнопки</label>
          <input
            type="text"
            value={settings.hero_cta_text}
            onChange={(e) => setSettings({ ...settings, hero_cta_text: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Цвет фона</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={settings.hero_background_color}
                onChange={(e) => setSettings({ ...settings, hero_background_color: e.target.value })}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.hero_background_color}
                onChange={(e) => setSettings({ ...settings, hero_background_color: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Прозрачность фона</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={settings.hero_background_opacity}
              onChange={(e) => setSettings({ ...settings, hero_background_opacity: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">О платформе</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Заголовок</label>
          <input
            type="text"
            value={settings.about_title}
            onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
          <textarea
            rows={4}
            value={settings.about_description}
            onChange={(e) => setSettings({ ...settings, about_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <ImageUploader
            bucket="site-assets"
            currentImage={settings.about_image_url}
            onUploadStart={() => setUploading(true)}
            onUploadComplete={(url) => {
              setSettings({ ...settings, about_image_url: url });
              setUploading(false);
            }}
            label="Изображение раздела"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Список преимуществ</label>
            <button
              onClick={addFeature}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить</span>
            </button>
          </div>
          {settings.about_features.length === 0 ? (
            <p className="text-sm text-gray-600">Преимущества не добавлены</p>
          ) : (
            <div className="space-y-3">
              {settings.about_features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Название преимущества"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Плашка призыва к действию</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Заголовок плашки</label>
          <input
            type="text"
            value={settings.cta_card_title}
            onChange={(e) => setSettings({ ...settings, cta_card_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Начните сегодня"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Подзаголовок плашки</label>
          <input
            type="text"
            value={settings.cta_card_subtitle}
            onChange={(e) => setSettings({ ...settings, cta_card_subtitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="И измените свое будущее"
          />
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Футер</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Описание в футере</label>
          <textarea
            rows={3}
            value={settings.footer_description}
            onChange={(e) => setSettings({ ...settings, footer_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Социальные сети</h3>
          <button
            onClick={addSocialLink}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить</span>
          </button>
        </div>

        {settings.social_links.length === 0 ? (
          <p className="text-sm text-gray-600">Ссылки на социальные сети не добавлены</p>
        ) : (
          <div className="space-y-4">
            {settings.social_links.map((link: SocialLink, index: number) => {
              const selectedPlatform = SOCIAL_PLATFORMS.find(p => p.value === link.platform) || SOCIAL_PLATFORMS[0];
              const Icon = selectedPlatform.icon;

              return (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <select
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                          {platform.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => removeSocialLink(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {uploading && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Изображение загружается... Пожалуйста, дождитесь завершения загрузки перед сохранением.
          </p>
        </div>
      )}
    </div>
  );
}
