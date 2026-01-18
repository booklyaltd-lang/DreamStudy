# Инструкция по деплою

## Настройка переменных окружения

Перед деплоем убедитесь, что в файле `.env` указан правильный URL вашего сайта:

```
VITE_SITE_URL=https://bizdevblog.ru
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_SUPABASE_URL=your_url_here
```

**ВАЖНО:** При деплое на хостинг, добавьте эти переменные окружения в настройки вашего хостинга.

## Деплой на Netlify

1. Подключите репозиторий к Netlify
2. Добавьте переменные окружения:
   - `VITE_SITE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_URL`
3. Настройки сборки:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Файл `public/_redirects` автоматически настроит SPA роутинг

## Деплой на Vercel

1. Подключите репозиторий к Vercel
2. Добавьте переменные окружения в настройках проекта
3. Vercel автоматически использует `vercel.json` для настройки роутинга
4. Build command: `npm run build`
5. Output directory: `dist`

## Деплой на Apache сервер

1. Соберите проект: `npm run build`
2. Загрузите содержимое папки `dist` на сервер
3. Файл `.htaccess` автоматически настроит роутинг
4. Убедитесь, что `mod_rewrite` включен на сервере

## Настройка Open Graph для социальных сетей

Для правильного отображения статей при шаринге в социальных сетях:

1. Убедитесь, что `VITE_SITE_URL` содержит полный URL с протоколом: `https://bizdevblog.ru`
2. Убедитесь, что изображения обложек статей загружены и доступны
3. Изображения должны быть размером минимум 1200x630 пикселей для Facebook

## Тестирование Open Graph тегов

Используйте следующие инструменты для проверки:

- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Проверка работы роутинга

После деплоя проверьте, что прямые ссылки на статьи работают:

- `https://bizdevblog.ru/blog/your-article-slug`
- Обновление страницы не должно приводить к 404 ошибке
