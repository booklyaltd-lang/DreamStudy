import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Clock, CheckCircle, ShoppingCart } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  duration_hours: number;
  is_published: boolean;
  is_purchased: boolean;
}

interface CoursesListProps {
  onCourseSelect: (courseId: string) => void;
}

export default function CoursesList({ onCourseSelect }: CoursesListProps) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);

      const [coursesResult, purchasesResult] = await Promise.all([
        supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('course_purchases')
          .select('course_id')
          .eq('user_id', user!.id)
      ]);

      if (coursesResult.data) {
        const purchasedIds = new Set(
          purchasesResult.data?.map(p => p.course_id) || []
        );

        const coursesWithPurchaseStatus = coursesResult.data.map(course => ({
          ...course,
          is_purchased: purchasedIds.has(course.id)
        }));

        setCourses(coursesWithPurchaseStatus);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (courseId: string, price: number) => {
    try {
      const { error: purchaseError } = await supabase
        .from('course_purchases')
        .insert({
          user_id: user!.id,
          course_id: courseId,
          price_paid: price
        });

      if (purchaseError) {
        throw purchaseError;
      }

      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user!.id,
          course_id: courseId
        });

      if (enrollmentError) {
        throw enrollmentError;
      }

      await loadCourses();
      alert('Курс успешно куплен!');
    } catch (error) {
      console.error('Error purchasing course:', error);
      alert('Ошибка при покупке курса');
    }
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
          <h1 className="text-3xl font-bold text-slate-900">Каталог курсов</h1>
          <p className="text-slate-600 mt-2">Выберите курс для начала обучения</p>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
              >
                {course.thumbnail_url && (
                  <div className="aspect-video overflow-hidden bg-slate-200">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                    {course.duration_hours > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration_hours} ч</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Видео-курс</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div>
                      <span className="text-2xl font-bold text-slate-900">
                        {course.price} ₽
                      </span>
                    </div>

                    {course.is_purchased ? (
                      <div>
                        <button
                          onClick={() => onCourseSelect(course.id)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Открыть
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePurchase(course.id, course.price)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Купить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Курсы пока не добавлены</p>
          </div>
        )}
      </div>
    </div>
  );
}
