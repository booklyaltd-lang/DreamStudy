import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteSettings {
  site_name: string;
  logo_url: string;
  hero_badge_text: string;
  hero_title: string;
  hero_description: string;
  hero_cta_text: string;
  hero_background_color: string;
  hero_background_opacity: number;
  footer_description: string;
  about_title: string;
  about_description: string;
  about_image_url: string;
  about_features: string[];
  cta_card_title: string;
  cta_card_subtitle: string;
  social_links: SocialLink[];
  site_tagline: string;
  meta_description: string;
  og_image_url: string;
  og_title: string;
  og_description: string;
}

const defaultSettings: SiteSettings = {
  site_name: 'EduPlatform',
  logo_url: '',
  hero_badge_text: 'Преобразите свою карьеру с курсами от экспертов',
  hero_title: 'Учите навыки, которые важны',
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
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек сайта:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}
