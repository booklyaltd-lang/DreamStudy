import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, ArrowLeft, Video, Clock, Eye, EyeOff } from 'lucide-react';
import { LessonEditor } from './LessonEditor';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface LessonsManagementProps {
  course: any;
  onBack: () => void;
}

export function LessonsManagement({ course, onBack }: LessonsManagementProps) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  useEffect(() => {
    fetchLessons();
  }, [course.id]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Ошибка загрузки уроков:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок?')) return;

    try {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchLessons();
    } catch (error: any) {
      alert('Ошибка удаления: ' + error.message);
    }
  };

  if (showEditor) {
    return (
      <LessonEditor
        lesson={editingLesson}
        courseId={course.id}
        onClose={() => {
          setShowEditor(false);
          setEditingLesson(null);
          fetchLessons();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Назад к курсам</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Уроки курса: {course.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{lessons.length} уроков</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Добавить урок</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Загрузка уроков...</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">У этого курса пока нет уроков</p>
          <button
            onClick={() => setShowEditor(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Создать первый урок
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{lesson.order_index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                    {lesson.is_published ? (
                      <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        <Eye className="h-3 w-3" />
                        <span>Опубликован</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        <EyeOff className="h-3 w-3" />
                        <span>Черновик</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.duration_minutes} мин</span>
                    </span>
                    {lesson.video_url && (
                      <span className="flex items-center space-x-1">
                        <Video className="h-4 w-4" />
                        <span className="capitalize">{lesson.video_type}</span>
                      </span>
                    )}
                    <span className="text-gray-400">slug: {lesson.slug}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingLesson(lesson);
                    setShowEditor(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Редактировать"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Удалить"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
