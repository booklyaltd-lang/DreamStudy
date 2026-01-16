import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Lock, PlayCircle, ArrowLeft, Clock } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_completed: boolean;
  is_locked: boolean;
}

interface CourseViewerProps {
  courseId: string;
  onBack?: () => void;
}

export default function CourseViewer({ courseId, onBack }: CourseViewerProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user && courseId) {
      loadCourseData();
    }
  }, [user, courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);

      const [courseResult, enrollmentResult, lessonsResult, progressResult] = await Promise.all([
        supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single(),
        supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user!.id)
          .eq('course_id', courseId)
          .maybeSingle(),
        supabase
          .from('course_lessons')
          .select('*')
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('order_index', { ascending: true }),
        supabase
          .from('lesson_progress')
          .select('lesson_id, is_completed')
          .eq('user_id', user!.id)
          .eq('course_id', courseId)
      ]);

      if (courseResult.data) {
        setCourse(courseResult.data);
      }

      const isEnrolled = !!enrollmentResult.data;
      setHasAccess(isEnrolled);

      if (lessonsResult.data) {
        const progressMap = new Map(
          progressResult.data?.map(p => [p.lesson_id, p.is_completed]) || []
        );

        let lastCompletedIndex = -1;
        const processedLessons: Lesson[] = lessonsResult.data.map((lesson, index) => {
          const isCompleted = progressMap.get(lesson.id) || false;
          if (isCompleted) {
            lastCompletedIndex = index;
          }

          const isLocked = !isEnrolled || (index > lastCompletedIndex + 1);

          return {
            id: lesson.id,
            title: lesson.title,
            description: lesson.content || '',
            video_url: lesson.video_url || '',
            duration_minutes: lesson.duration_minutes || 0,
            order_index: lesson.order_index,
            is_completed: isCompleted,
            is_locked: isLocked
          };
        });

        setLessons(processedLessons);

        if (isEnrolled) {
          const firstIncomplete = processedLessons.find(l => !l.is_completed && !l.is_locked);
          if (firstIncomplete) {
            setSelectedLesson(firstIncomplete);
          } else if (processedLessons.length > 0) {
            setSelectedLesson(processedLessons[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.is_locked) {
      setSelectedLesson(lesson);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user!.id,
          course_id: courseId,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (!error) {
        await loadCourseData();
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Нет доступа к курсу
          </h2>
          <p className="text-slate-600 mb-6">
            Чтобы получить доступ к этому курсу, необходимо его приобрести.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Вернуться к курсам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{course?.title}</h1>
              <p className="text-sm text-slate-600">
                {lessons.filter(l => l.is_completed).length} / {lessons.length} уроков пройдено
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {selectedLesson.video_url ? (
                  <div className="aspect-video bg-slate-900">
                    <video
                      src={selectedLesson.video_url}
                      controls
                      className="w-full h-full"
                      onEnded={() => markLessonComplete(selectedLesson.id)}
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <PlayCircle className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Видео будет добавлено позже</p>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {selectedLesson.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{selectedLesson.duration_minutes} мин</span>
                        </div>
                        {selectedLesson.is_completed && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Пройден</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!selectedLesson.is_completed && (
                      <button
                        onClick={() => markLessonComplete(selectedLesson.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Отметить как пройденный
                      </button>
                    )}
                  </div>
                  {selectedLesson.description && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Содержание урока</h3>
                      <div className="prose max-w-none">
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedLesson.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Выберите урок для начала обучения</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Содержание курса
              </h3>
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    disabled={lesson.is_locked}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100'
                        : lesson.is_locked
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {lesson.is_completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : lesson.is_locked ? (
                          <Lock className="w-5 h-5 text-slate-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-500">
                            Урок {index + 1}
                          </span>
                          {lesson.duration_minutes > 0 && (
                            <span className="text-xs text-slate-400">
                              {lesson.duration_minutes} мин
                            </span>
                          )}
                        </div>
                        <p className={`font-medium text-sm ${
                          lesson.is_locked ? 'text-slate-500' : 'text-slate-900'
                        }`}>
                          {lesson.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
