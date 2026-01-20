import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Crown, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';

interface Subscription {
  id: string;
  tier: 'basic' | 'premium';
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface CoursePurchase {
  id: string;
  course_id: string;
  purchased_at: string;
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
  };
}

interface CourseProgress {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

export default function UserProfile() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [purchases, setPurchases] = useState<CoursePurchase[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  console.log('=== UserProfile component rendered ===');
  console.log('User:', user);

  useEffect(() => {
    console.log('=== UserProfile useEffect triggered ===');
    console.log('User in useEffect:', user);
    if (user) {
      loadUserData();
    } else {
      console.log('No user found in useEffect');
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      console.log('=== UserProfile: loadUserData started ===');
      console.log('User ID:', user!.id);
      console.log('User Email:', user!.email);

      console.log('Fetching profile...');
      const profileResult = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single();
      console.log('Profile result:', profileResult);

      console.log('Fetching subscription...');
      const subscriptionResult = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();
      console.log('Subscription result:', subscriptionResult);

      console.log('Fetching purchases...');
      const purchasesResult = await supabase
        .from('course_purchases')
        .select(`
          id,
          course_id,
          purchased_at,
          course:courses (
            id,
            title,
            description,
            thumbnail_url
          )
        `)
        .eq('user_id', user!.id)
        .order('purchased_at', { ascending: false });
      console.log('Purchases result:', purchasesResult);
      console.log('Purchases data:', purchasesResult.data);
      console.log('Purchases error:', purchasesResult.error);

      const isAdmin = profileResult.data?.role === 'admin';
      console.log('Is Admin:', isAdmin);

      if (subscriptionResult.data) {
        setSubscription(subscriptionResult.data);
      }

      if (isAdmin) {
        const { data: allCourses } = await supabase
          .from('courses')
          .select('id, title, description, thumbnail_url')
          .order('created_at', { ascending: false });

        if (allCourses && allCourses.length > 0) {
          const adminPurchases = allCourses.map(course => ({
            id: `admin-${course.id}`,
            course_id: course.id,
            purchased_at: new Date().toISOString(),
            course: {
              id: course.id,
              title: course.title,
              description: course.description,
              thumbnail_url: course.thumbnail_url
            }
          }));

          setPurchases(adminPurchases as any);
          const courseIds = allCourses.map(c => c.id);
          console.log('Admin: Loading progress for all courses:', courseIds);
          await loadCourseProgress(courseIds);
        }
      } else if (purchasesResult.data && purchasesResult.data.length > 0) {
        setPurchases(purchasesResult.data as any);
        const courseIds = purchasesResult.data.map(p => p.course_id);
        console.log('Loading progress for courses:', courseIds);
        await loadCourseProgress(courseIds);
      } else {
        console.log('No purchases found');
        setPurchases([]);
        setCourseProgress({});
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseProgress = async (courseIds: string[]) => {
    try {
      const progressMap: Record<string, CourseProgress> = {};

      console.log('Loading progress for user:', user!.id);
      console.log('Course IDs:', courseIds);

      for (const courseId of courseIds) {
        const [lessonsResult, progressResult] = await Promise.all([
          supabase
            .from('course_lessons')
            .select('id')
            .eq('course_id', courseId)
            .eq('is_published', true),
          supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', user!.id)
            .eq('course_id', courseId)
            .eq('is_completed', true)
        ]);

        const totalLessons = lessonsResult.data?.length || 0;
        const completedLessons = progressResult.data?.length || 0;
        const progressPercentage = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        console.log(`Course ${courseId}:`, {
          totalLessons,
          completedLessons,
          progressPercentage,
          lessons: lessonsResult.data?.map(l => l.id),
          progress: progressResult.data
        });

        progressMap[courseId] = {
          course_id: courseId,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_percentage: progressPercentage
        };
      }

      console.log('Final progress map:', progressMap);
      setCourseProgress(progressMap);
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isSubscriptionExpiringSoon = (endDate: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Мой профиль</h1>
          <p className="text-slate-600 mt-2">Управление подпиской и курсами</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {user?.email}
                  </h2>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-900">Подписка</h3>
                </div>

                {subscription ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-900">
                          Статус
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          subscription.tier === 'premium'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {subscription.tier === 'premium' ? 'Premium' : 'Basic'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-amber-800">
                        <Calendar className="w-4 h-4" />
                        <span>
                          До {formatDate(subscription.end_date)}
                        </span>
                      </div>

                      {isSubscriptionExpiringSoon(subscription.end_date) && (
                        <div className="mt-3 text-xs text-amber-900 bg-amber-200 rounded-md p-2">
                          ⚠️ Подписка скоро истечёт
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      Активна с {formatDate(subscription.start_date)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-600 text-sm mb-4">
                      У вас нет активной подписки
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Выбрать тариф
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 text-lg">
                    Мои курсы
                  </h3>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Обновить прогресс"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {purchases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchases.map((purchase) => (
                    <a
                      key={purchase.id}
                      href={`/course/${purchase.course_id}`}
                      className="group block bg-slate-50 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      {purchase.course.thumbnail_url && (
                        <div className="aspect-video overflow-hidden bg-slate-200">
                          <img
                            src={purchase.course.thumbnail_url}
                            alt={purchase.course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {purchase.course.title}
                        </h4>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                          {purchase.course.description}
                        </p>

                        {courseProgress[purchase.course_id] && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                              <span>Прогресс</span>
                              <span className="font-semibold">
                                {courseProgress[purchase.course_id].progress_percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full"
                                style={{ width: `${courseProgress[purchase.course_id].progress_percentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {courseProgress[purchase.course_id].completed_lessons} из {courseProgress[purchase.course_id].total_lessons} уроков
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Куплен {formatDate(purchase.purchased_at)}</span>
                          {courseProgress[purchase.course_id]?.progress_percentage === 100 && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    У вас пока нет купленных курсов
                  </p>
                  <a
                    href="/courses"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Посмотреть курсы
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
