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

- Интеграция с **CloudPayments** и **YooKassa**
- Прием платежей за курсы
- Подписки на тарифные планы
- Автоматическое предоставление доступа после оплаты
- Webhook для обработки уведомлений о платежах
- Виджет CloudPayments для удобной оплаты

### Технологии

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage, Auth)
- **Платежи**: CloudPayments, YooKassa
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

### 3. Настройка платежной системы

Выберите платежную систему:
- **CloudPayments** - рекомендуется. Подробное руководство: [CLOUDPAYMENTS_SETUP.md](./CLOUDPAYMENTS_SETUP.md)
- **YooKassa** - альтернативная система. Подробное руководство: [YOOKASSA_SETUP.md](./YOOKASSA_SETUP.md)

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
│   │   ├── create-payment/         # Создание платежа
│   │   ├── confirm-payment/        # Ручное подтверждение (резерв)
│   │   ├── cloudpayments-webhook/  # Обработка CloudPayments
│   │   └── yookassa-webhook/       # Обработка YooKassa
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
- `payments` - платежи (CloudPayments/YooKassa)
- `pricing_tiers` - тарифные планы
- `site_settings` - настройки сайта

## Деплой

Подробная инструкция по деплою находится в файле [DEPLOYMENT.md](./DEPLOYMENT.md)

### Поддерживаемые платформы

- Vercel
- Netlify
- Apache/Nginx

## Настройка платежных систем

### CloudPayments (рекомендуется)

Полное руководство находится в файле [CLOUDPAYMENTS_SETUP.md](./CLOUDPAYMENTS_SETUP.md)

Основные шаги:
1. Регистрация в CloudPayments
2. Получение Public ID и API пароля
3. Настройка в админ-панели приложения
4. **КРИТИЧЕСКИ ВАЖНО**: Настройка Webhook в личном кабинете CloudPayments
5. Тестирование платежей

### YooKassa (альтернатива)

Полное руководство находится в файле [YOOKASSA_SETUP.md](./YOOKASSA_SETUP.md)

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
