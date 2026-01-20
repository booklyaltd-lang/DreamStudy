# DreamStudy

Современная платформа для онлайн-обучения с интегрированной системой управления контентом, курсами и подписками.

## Возможности

### Основные функции

- Управление онлайн-курсами с уроками и прогрессом
- Система блога с публикацией статей
- Многоуровневая система подписок (Free, Basic, Premium)
- Интеграция с YooKassa для приема платежей
- Административная панель для управления контентом
- Аутентификация пользователей через Supabase Auth
- Адаптивный дизайн для всех устройств

### Платежи

- Интеграция с **CloudPayments**
- Прием платежей за курсы
- Подписки на тарифные планы
- Автоматическое предоставление доступа после оплаты
- Webhook для обработки уведомлений о платежах

### Технологии

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage, Auth)
- **Платежи**: YooKassa API
- **Иконки**: Lucide React

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=ваш_supabase_url
VITE_SUPABASE_ANON_KEY=ваш_supabase_anon_key
```

### 3. Настройка YooKassa

Смотрите подробное руководство в файле [YOOKASSA_SETUP.md](./YOOKASSA_SETUP.md)

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### 5. Сборка для production

```bash
npm run build
```

## Структура проекта

```
├── src/
│   ├── components/        # React компоненты
│   │   ├── AdminPanel.tsx
│   │   ├── PaymentButton.tsx
│   │   ├── CourseViewer.tsx
│   │   └── ...
│   ├── contexts/         # React контексты
│   │   ├── AuthContext.tsx
│   │   └── SiteSettingsContext.tsx
│   ├── lib/             # Утилиты и конфигурация
│   │   ├── supabase.ts
│   │   ├── storage.ts
│   │   └── meta.ts
│   ├── App.tsx          # Главный компонент приложения
│   └── main.tsx         # Точка входа
├── supabase/
│   ├── functions/       # Edge Functions
│   │   ├── create-payment/
│   │   └── yookassa-webhook/
│   └── migrations/      # Миграции базы данных
├── public/              # Статические файлы
└── dist/               # Собранное приложение

```

## База данных

### Основные таблицы

- `profiles` - профили пользователей
- `courses` - курсы
- `course_lessons` - уроки курсов
- `blog_posts` - статьи блога
- `user_subscriptions` - подписки пользователей
- `course_purchases` - покупки курсов
- `payments` - платежи через YooKassa
- `pricing_tiers` - тарифные планы
- `site_settings` - настройки сайта

## Деплой

Подробная инструкция по деплою находится в файле [DEPLOYMENT.md](./DEPLOYMENT.md)

### Поддерживаемые платформы

- Vercel
- Netlify
- Apache/Nginx

## Настройка YooKassa

Полное руководство по интеграции платежной системы YooKassa находится в файле [YOOKASSA_SETUP.md](./YOOKASSA_SETUP.md)

Основные шаги:
1. Регистрация в CloudPayments
2. Получение API ключей
3. Настройка переменных окружения в Supabase
4. Настройка Webhook
5. Тестирование платежей

## Разработка

### Доступные команды

```bash
npm run dev       # Запуск dev-сервера
npm run build     # Сборка для production
npm run preview   # Предпросмотр production сборки
npm run lint      # Проверка кода
npm run typecheck # Проверка типов TypeScript
```

### Edge Functions

Развернутые Edge Functions:
- `create-payment` - создание платежа в YooKassa
- `yookassa-webhook` - обработка уведомлений от YooKassa

## Лицензия

Проприетарное ПО
