import { useState, useEffect } from 'react';
import { BookOpen, Menu, X, User, LogOut, Clock, BarChart3, Facebook, Twitter, Linkedin, Instagram, ArrowRight, Sparkles, Video, Trophy, Search, Filter, Tag, Calendar, Share2, Check, ArrowLeft, PlayCircle, Lock, CheckCircle, Mail, AlertCircle, Settings, Shield, TrendingUp, Award, Youtube, Send, MessageCircle, Phone } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Session, User as AuthUser } from '@supabase/supabase-js';
import { ImageUploader } from './components/ImageUploader';
import { AdminPanel } from './components/AdminPanel';
import { Pagination } from './components/Pagination';
import { Breadcrumbs } from './components/Breadcrumbs';
import { useSiteSettings } from './contexts/SiteSettingsContext';
import UserProfile from './components/UserProfile';
import CourseViewer from './components/CourseViewer';
import CoursesList from './components/CoursesList';
import SubscriptionPlans from './components/SubscriptionPlans';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type PageType = 'home' | 'courses' | 'course' | 'blog' | 'blogpost' | 'pricing' | 'dashboard' | 'profile' | 'admin' | 'admin-setup' | 'signin' | 'signup' | 'my-courses' | 'course-viewer' | 'subscriptions' | 'user-profile';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [pageData, setPageData] = useState<any>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page: PageType, data?: any) => {
    setCurrentPage(page);
    setPageData(data);
    window.scrollTo(0, 0);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    handleNavigate('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'courses':
        return <CoursesPage onNavigate={handleNavigate} />;
      case 'course':
        return <CourseDetailPage course={pageData} onNavigate={handleNavigate} user={user} />;
      case 'blog':
        return <BlogPage onNavigate={handleNavigate} />;
      case 'blogpost':
        return <BlogPostPage post={pageData} onNavigate={handleNavigate} />;
      case 'pricing':
        return <PricingPage onNavigate={handleNavigate} user={user} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} user={user} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} user={user} />;
      case 'admin':
        return <AdminPanel user={user} onNavigate={handleNavigate} />;
      case 'admin-setup':
        return <AdminSetupPage onNavigate={handleNavigate} />;
      case 'signin':
        return <SignInPage onNavigate={handleNavigate} />;
      case 'signup':
        return <SignUpPage onNavigate={handleNavigate} />;
      case 'user-profile':
        return <UserProfile />;
      case 'my-courses':
        return <CoursesList onCourseSelect={(courseId) => handleNavigate('course-viewer', courseId)} />;
      case 'course-viewer':
        return <CourseViewer courseId={pageData} onBack={() => handleNavigate('my-courses')} />;
      case 'subscriptions':
        return <SubscriptionPlans />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={handleNavigate} currentPage={currentPage} user={user} onSignOut={signOut} />
      <main>{renderPage()}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

function Header({ onNavigate, currentPage, user, onSignOut }: { onNavigate: (p: PageType, d?: any) => void; currentPage: PageType; user: AuthUser | null; onSignOut: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { settings } = useSiteSettings();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.site_name} className="h-8 w-8 object-contain" />
            ) : (
              <BookOpen className="h-8 w-8 text-blue-600" />
            )}
            <span className="ml-2 text-xl font-bold text-gray-900">{settings.site_name}</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {[{ name: 'Главная', page: 'home' as const }, { name: 'Курсы', page: 'courses' as const }, { name: 'Блог', page: 'blog' as const }, { name: 'Тарифы', page: 'pricing' as const }].map((item) => (
              <button key={item.name} onClick={() => onNavigate(item.page)} className={`text-sm font-medium transition-colors ${currentPage === item.page ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                {item.name}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Аккаунт</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <button onClick={() => { onNavigate('user-profile'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Мой профиль</span>
                    </button>
                    <button onClick={() => { onNavigate('my-courses'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Мои курсы</span>
                    </button>
                    <button onClick={() => { onNavigate('subscriptions'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <Award className="h-4 w-4" />
                      <span>Подписка</span>
                    </button>
                    <button onClick={() => { onNavigate('dashboard'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Мой кабинет</button>
                    <button onClick={() => { onNavigate('profile'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Настройки</span>
                    </button>
                    <button onClick={onSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Выйти</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => onNavigate('signin')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">Войти</button>
                <button onClick={() => onNavigate('signup')} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Начать</button>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {[{ name: 'Главная', page: 'home' as const }, { name: 'Курсы', page: 'courses' as const }, { name: 'Блог', page: 'blog' as const }, { name: 'Тарифы', page: 'pricing' as const }].map((item) => (
                <button key={item.name} onClick={() => { onNavigate(item.page); setMobileMenuOpen(false); }} className={`text-left text-base font-medium ${currentPage === item.page ? 'text-blue-600' : 'text-gray-700'}`}>
                  {item.name}
                </button>
              ))}
              {user ? (
                <>
                  <button onClick={() => { onNavigate('user-profile'); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-gray-700">Мой профиль</button>
                  <button onClick={() => { onNavigate('my-courses'); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-gray-700">Мои курсы</button>
                  <button onClick={() => { onNavigate('subscriptions'); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-gray-700">Подписка</button>
                  <button onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-gray-700">Мой кабинет</button>
                  <button onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-gray-700">Настройки</button>
                  <button onClick={onSignOut} className="text-left text-base font-medium text-red-600">Выйти</button>
                </>
              ) : (
                <>
                  <button onClick={() => { onNavigate('signin'); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-gray-700">Войти</button>
                  <button onClick={() => { onNavigate('signup'); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-blue-600">Начать</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function Footer({ onNavigate }: { onNavigate: (p: PageType) => void }) {
  const { settings } = useSiteSettings();

  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('facebook')) return Facebook;
    if (platformLower.includes('twitter') || platformLower.includes('x')) return Twitter;
    if (platformLower.includes('linkedin')) return Linkedin;
    if (platformLower.includes('instagram')) return Instagram;
    if (platformLower.includes('youtube')) return Youtube;
    if (platformLower.includes('telegram')) return Send;
    if (platformLower.includes('vk') || platformLower.includes('вконтакте')) return MessageCircle;
    if (platformLower.includes('whatsapp')) return Phone;
    if (platformLower.includes('email') || platformLower.includes('mail')) return Mail;
    return Share2;
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name} className="h-8 w-8 object-contain" />
              ) : (
                <BookOpen className="h-8 w-8 text-blue-500" />
              )}
              <span className="ml-2 text-xl font-bold text-white">{settings.site_name}</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">{settings.footer_description}</p>
            <div className="flex space-x-4">
              {settings.social_links.length > 0 ? (
                settings.social_links.map((link, i) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })
              ) : (
                [Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                    <Icon className="h-5 w-5" />
                  </a>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Платформа</h3>
            <ul className="space-y-2">
              {[{ name: 'Каталог курсов', page: 'courses' as const }, { name: 'Блог', page: 'blog' as const }, { name: 'Тарифы', page: 'pricing' as const }].map((item) => (
                <li key={item.name}>
                  <button onClick={() => onNavigate(item.page)} className="text-sm hover:text-blue-400 transition-colors">
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm hover:text-blue-400 transition-colors">Центр помощи</a></li>
              <li><a href="#" className="text-sm hover:text-blue-400 transition-colors">Условия использования</a></li>
              <li><a href="#" className="text-sm hover:text-blue-400 transition-colors">Политика конфиденциальности</a></li>
              <li><a href="#" className="text-sm hover:text-blue-400 transition-colors">Связаться с нами</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-400">© 2024 EduPlatform. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

function HomePage({ onNavigate }: { onNavigate: (p: PageType, d?: any) => void }) {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings();

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const { data } = await supabase.from('courses').select('*').eq('is_published', true).limit(3);
      setFeaturedCourses(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };

  const rgb = hexToRgb(settings.hero_background_color);
  const bgStyle = {
    background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${settings.hero_background_opacity})`
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10" style={bgStyle} />
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>{settings.hero_badge_text}</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              {settings.hero_title}
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              {settings.hero_description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button onClick={() => onNavigate('courses')} className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                <span>{settings.hero_cta_text}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={() => onNavigate('pricing')} className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all duration-300">
                Тарифы
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{settings.about_title}</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {settings.about_description}
              </p>
              <ul className="space-y-3">
                {settings.about_features.map((item, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={settings.about_image_url || "https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=800"}
                  alt={settings.about_title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-blue-600 text-white p-6 rounded-xl shadow-xl max-w-xs">
                <p className="text-3xl font-bold mb-1">{settings.cta_card_title}</p>
                <p className="text-blue-100">{settings.cta_card_subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Популярные курсы</h2>
            <p className="text-xl text-gray-600">Начните обучение с наших самых популярных курсов</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} onClick={() => onNavigate('course', course)} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button onClick={() => onNavigate('courses')} className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center space-x-2">
              <span>Все курсы</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Почему EduPlatform?</h2>
            <p className="text-xl text-blue-100">Всё, что вам нужно для успеха в вашем путешествии обучения</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{ icon: Video, title: 'Опытные преподаватели', desc: 'Учитесь у профессионалов индустрии с многолетним практическим опытом и проверенными методами обучения.' }, { icon: TrendingUp, title: 'Гибкое обучение', desc: 'Учитесь в своём темпе с пожизненным доступом к материалам курса и регулярными обновлениями контента.' }, { icon: Trophy, title: 'Сертификаты', desc: 'Получайте признанные сертификаты по завершению курса, чтобы продемонстрировать свои новые навыки работодателям.' }].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white">
                <item.icon className="h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-blue-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Готовы начать обучение?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Присоединяйтесь к нашему сообществу сегодня и получите доступ к премиум-курсам, экспертной поддержке и многому другому.
          </p>
          <button onClick={() => onNavigate('signup')} className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
            Начать бесплатно
          </button>
        </div>
      </section>
    </div>
  );
}

function CourseCard({ course, onClick }: { course: any; onClick: () => void }) {
  const levelColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  const levelLabels: Record<string, string> = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
  };

  const hasImage = course.thumbnail_url && course.thumbnail_url.trim() !== '';

  return (
    <div onClick={onClick} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group">
      <div className="relative h-48 overflow-hidden">
        {hasImage ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <div className="text-center text-white">
              <BookOpen className="h-16 w-16 mx-auto mb-2 opacity-80" />
              <span className="text-4xl font-bold opacity-90">{course.title.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[course.level]}`}>
            {levelLabels[course.level]}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

        <div className="flex items-center mb-4">
          {course.instructor_avatar && course.instructor_avatar.trim() !== '' ? (
            <img src={course.instructor_avatar} alt={course.instructor_name} className="w-8 h-8 rounded-full mr-2 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full mr-2 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-semibold">
              {course.instructor_name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-gray-700">{course.instructor_name}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration_hours}ч</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="h-4 w-4" />
              <span>{levelLabels[course.level]}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-blue-600 font-bold">
            {course.price === 0 ? <span>Бесплатно</span> : <span>{course.price} ₽</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursesPage({ onNavigate }: { onNavigate: (p: PageType, d?: any) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedLevel]);

  const fetchCourses = async () => {
    try {
      const { data } = await supabase.from('courses').select('*').eq('is_published', true).order('created_at', { ascending: false });
      setCourses(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses.filter((c) =>
      (!searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedLevel === 'all' || c.level === selectedLevel)
    );
    setFilteredCourses(filtered);
    setCurrentPage(1);
  };

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Главная', onClick: () => onNavigate('home') }, { label: 'Курсы' }]} />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Наши курсы</h1>
          <p className="text-xl text-gray-600">
            Найдите идеальный курс для развития ваших навыков и карьеры
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Поиск курсов..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                  <option value="all">Все уровни</option>
                  <option value="beginner">Начальный</option>
                  <option value="intermediate">Средний</option>
                  <option value="advanced">Продвинутый</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Показано {filteredCourses.length} из {courses.length} курсов</p>
            {(searchTerm || selectedLevel !== 'all') && (
              <button onClick={() => { setSearchTerm(''); setSelectedLevel('all'); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Очистить фильтры
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Курсы не найдены</h3>
            <p className="text-gray-600 mb-6">Попробуйте изменить фильтры или поисковый запрос</p>
            <button onClick={() => { setSearchTerm(''); setSelectedLevel('all'); }} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Очистить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedCourses.map((course) => (
                <CourseCard key={course.id} course={course} onClick={() => onNavigate('course', course)} />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CourseDetailPage({ course, onNavigate, user }: { course: any; onNavigate: (p: PageType, d?: any) => void; user: AuthUser | null }) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchLessons();
    if (user) {
      checkEnrollment();
    } else {
      setLoading(false);
    }
  }, [course.id, user]);

  const fetchLessons = async () => {
    try {
      const { data } = await supabase.from('course_lessons').select('*').eq('course_id', course.id).order('order_index', { ascending: true });
      setLessons(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkEnrollment = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', course.id).maybeSingle();
      setIsEnrolled(!!data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      onNavigate('signin');
      return;
    }
    setEnrolling(true);
    try {
      await supabase.from('enrollments').insert({ user_id: user.id, course_id: course.id, progress_percentage: 0 });
      setIsEnrolled(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const levelColors: Record<string, string> = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' };

  const levelLabels: Record<string, string> = {
    beginner: 'Начальный',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button onClick={() => onNavigate('courses')} className="flex items-center space-x-2 text-blue-100 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Назад к курсам</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${levelColors[course.level]}`}>
                  {levelLabels[course.level]}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>

              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{course.duration_hours} часов</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>{levelLabels[course.level]}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <PlayCircle className="h-5 w-5" />
                  <span>{lessons.length} уроков</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 text-gray-900">
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                <div className="text-3xl font-bold mb-2">
                  {course.price === 0 ? <span className="text-green-600">Бесплатно</span> : <span>{course.price} ₽</span>}
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  {course.required_tier === 'free' ? 'Доступен всем' : `Требуется подписка ${course.required_tier}`}
                </p>

                {loading ? (
                  <div className="bg-gray-200 h-12 rounded-lg animate-pulse" />
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <button onClick={() => onNavigate('dashboard')} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Перейти в кабинет</span>
                    </button>
                    <p className="text-sm text-center text-green-600 font-medium">
                      Вы записаны на этот курс
                    </p>
                  </div>
                ) : (
                  <button onClick={handleEnroll} disabled={enrolling} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                    {enrolling ? 'Запись...' : 'Записаться'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">О курсе</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {course.full_description}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Программа курса</h2>
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        <p className="text-sm text-gray-500">{lesson.duration_minutes} минут</p>
                      </div>
                    </div>
                    <div>
                      {lesson.is_free_preview ? (
                        <span className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                          <PlayCircle className="h-4 w-4" />
                          <span>Превью</span>
                        </span>
                      ) : !isEnrolled ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <PlayCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Преподаватель</h3>
              <div className="flex items-center space-x-3 mb-4">
                {course.instructor_avatar && course.instructor_avatar.trim() !== '' ? (
                  <img src={course.instructor_avatar} alt={course.instructor_name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                    {course.instructor_name?.charAt(0).toUpperCase() || 'П'}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{course.instructor_name}</h4>
                  <p className="text-sm text-gray-600">Эксперт-преподаватель</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogPage({ onNavigate }: { onNavigate: (p: PageType, d?: any) => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, selectedCategory]);

  const fetchPosts = async () => {
    try {
      const { data } = await supabase.from('blog_posts').select('*').eq('is_published', true).order('published_at', { ascending: false });
      setPosts(data || []);
      const uniqueCategories = Array.from(new Set(data?.map((p: any) => p.category) || [])) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts.filter((p) =>
      (!searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === 'all' || p.category === selectedCategory)
    );
    setFilteredPosts(filtered);
    setCurrentPage(1);
  };

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Главная', onClick: () => onNavigate('home') }, { label: 'Блог' }]} />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Наш блог</h1>
          <p className="text-xl text-gray-600">
            Полезные материалы, руководства и истории для вашего развития
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Поиск статей..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                  <option value="all">Все категории</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Статьи не найдены</h3>
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Очистить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map((post) => (
                <BlogCard key={post.id} post={post} onClick={() => onNavigate('blogpost', post)} />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BlogCard({ post, onClick }: { post: any; onClick: () => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <article onClick={onClick} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group">
      <div className="relative h-56 overflow-hidden">
        <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
            {post.category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(post.published_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.reading_time_minutes} мин чтения</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function BlogPostPage({ post, onNavigate }: { post: any; onNavigate: (p: PageType) => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={() => onNavigate('blog')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>Назад к блогу</span>
        </button>

        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
            {post.category}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center space-x-6 text-gray-600 mb-8">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{formatDate(post.published_at)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{post.reading_time_minutes} мин чтения</span>
          </div>
        </div>

        <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 mb-8">
          <p className="text-xl text-gray-700 leading-relaxed mb-6">{post.excerpt}</p>
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="h-5 w-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Теги</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <Share2 className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Понравилась статья?</h3>
          <p className="text-blue-100 mb-6">Поделитесь ею с друзьями и помогите другим учиться</p>
          <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            Поделиться статьёй
          </button>
        </div>
      </article>
    </div>
  );
}

function PricingPage({ onNavigate, user }: { onNavigate: (p: PageType) => void; user: AuthUser | null }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const formattedPlans = (data || []).map((tier, index) => ({
        name: tier.name,
        price: tier.price_monthly,
        priceYearly: tier.price_yearly,
        period: 'месяц',
        features: tier.features || [],
        tier: tier.slug,
        highlighted: index === 1
      }));

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Ошибка загрузки тарифов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (tier: string) => {
    if (!user) {
      onNavigate('signup');
      return;
    }
    if (tier === 'free') {
      onNavigate('courses');
    } else {
      alert(`Upgrade to ${tier} plan selected. Payment integration would be implemented here.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Выберите свой тариф</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Выберите идеальный план для вашего обучения. Повышайте, понижайте тариф или отменяйте в любое время.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded mb-6"></div>
                <div className="h-10 bg-gray-200 rounded mb-8"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Тарифные планы не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${plan.highlighted ? 'ring-2 ring-blue-600 transform scale-105' : 'hover:shadow-xl'}`}>
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2 text-sm font-semibold">
                    Самый популярный
                  </div>
                )}

                <div className={`p-8 ${plan.highlighted ? 'pt-14' : ''}`}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">₽/{plan.period}</span>
                    </div>
                    {plan.priceYearly > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        или {plan.priceYearly} ₽/год
                      </div>
                    )}
                  </div>

                  <button onClick={() => handleSelectPlan(plan.tier)} className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                    {plan.tier === 'free' ? 'Начать' : 'Выбрать тариф'}
                  </button>

                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Не уверены, какой план вам подходит?
          </h2>
          <p className="text-gray-600 mb-6">
            Начните с бесплатного плана и повышайте тариф в любое время по мере роста ваших потребностей в обучении. Все планы включают нашу гарантию удовлетворенности.
          </p>
          <button onClick={() => onNavigate('courses')} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Посмотреть бесплатные курсы
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ onNavigate, user }: { onNavigate: (p: PageType, d?: any) => void; user: AuthUser | null }) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Ошибка проверки роли:', error);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('enrollments')
        .select(`*, courses:course_id (*)`)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Пожалуйста, войдите</h2>
          <button onClick={() => onNavigate('signin')} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            Войти
          </button>
        </div>
      </div>
    );
  }

  const completedCourses = enrollments.filter((e) => e.progress_percentage === 100).length;
  const inProgressCourses = enrollments.filter((e) => e.progress_percentage > 0 && e.progress_percentage < 100).length;
  const totalHours = enrollments.reduce((sum, e) => sum + (e.courses?.duration_hours || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Мой кабинет</h1>
            <p className="text-gray-600">Отслеживайте свой прогресс обучения и продолжайте курсы</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Shield className="h-5 w-5" />
              <span className="font-medium">Админ-панель</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[{ icon: BookOpen, count: enrollments.length, label: 'Записанных курсов' }, { icon: TrendingUp, count: inProgressCourses, label: 'В процессе' }, { icon: Award, count: completedCourses, label: 'Завершено' }, { icon: Clock, count: `${totalHours}ч`, label: 'Всего контента' }].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Мои курсы</h2>
            <button onClick={() => onNavigate('courses')} className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
              Смотреть ещё
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Пока нет курсов</h3>
              <p className="text-gray-600 mb-6">Начните обучение, записавшись на свой первый курс</p>
              <button onClick={() => onNavigate('courses')} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Найти курсы
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => {
                const course = enrollment.courses;
                if (!course) return null;

                const levelLabels: Record<string, string> = {
                  beginner: 'Начальный',
                  intermediate: 'Средний',
                  advanced: 'Продвинутый',
                };

                return (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => onNavigate('course', course)}>
                    <div className="flex items-start space-x-4">
                      <img src={course.thumbnail_url} alt={course.title} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>{levelLabels[course.level] || course.level}</span>
                          <span>{course.duration_hours}ч</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              Прогресс: {enrollment.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${enrollment.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignInPage({ onNavigate }: { onNavigate: (p: PageType) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">С возвращением</h1>
          <p className="text-gray-600">Войдите, чтобы продолжить обучение</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email адрес
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ваш@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите ваш пароль"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <button onClick={() => onNavigate('signup')} className="text-blue-600 hover:text-blue-700 font-medium">
                Зарегистрироваться
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignUpPage({ onNavigate }: { onNavigate: (p: PageType) => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, email, full_name: fullName });
      }

      setSuccess(true);
      setTimeout(() => onNavigate('dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20 pb-12 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Создайте аккаунт</h1>
          <p className="text-gray-600">Начните свой путь обучения сегодня</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                Аккаунт успешно создан! Перенаправление в кабинет...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Полное имя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Иван Иванов"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email адрес
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ваш@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Минимум 6 символов"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Повторите ваш пароль"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Создание аккаунта...' : success ? 'Аккаунт создан!' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <button onClick={() => onNavigate('signin')} className="text-blue-600 hover:text-blue-700 font-medium">
                Войти
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSetupPage({ onNavigate }: { onNavigate: (p: PageType) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin', full_name: fullName })
          .eq('id', data.user.id);

        if (updateError) throw updateError;

        setSuccess(true);
        setTimeout(() => {
          onNavigate('signin');
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка создания администратора');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Создание администратора
          </h2>
          <p className="text-gray-600">
            Создайте первого администратора для управления платформой
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Администратор создан успешно
            </h3>
            <p className="text-sm text-green-700">
              Перенаправление на страницу входа...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Полное имя
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email адрес
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Минимум 6 символов"
                  minLength={6}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Сохраните эти данные в безопасном месте. Они понадобятся для входа в административную панель.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Создание...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Создать администратора</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => onNavigate('home')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                На главную страницу
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePage({ onNavigate, user }: { onNavigate: (p: PageType) => void; user: AuthUser | null }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Профиль успешно обновлён' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (url: string, path: string) => {
    setAvatarUrl(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Пожалуйста, войдите</h2>
          <button onClick={() => onNavigate('signin')} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Назад к кабинету</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Настройки профиля</h1>
          <p className="text-gray-600 mb-8">Управляйте своей личной информацией</p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {message.text}
              </p>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <ImageUploader
                  bucket="avatars"
                  currentImage={avatarUrl}
                  onUploadComplete={handleAvatarUpload}
                  label="Аватар профиля"
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email адрес
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Полное имя
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите ваше имя"
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Информация об аккаунте</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">ID пользователя</span>
              <span className="text-sm text-gray-600 font-mono">{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Дата регистрации</span>
              <span className="text-sm text-gray-600">
                {new Date(user.created_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-700">Статус email</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Подтверждён
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
