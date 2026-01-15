/*
  # Добавление политик RLS для управления блог-постами

  1. Политики
    - Администраторы могут создавать новые блог-посты
    - Администраторы могут обновлять любые блог-посты
    - Администраторы могут удалять любые блог-посты
    - Аутентифицированные пользователи могут читать опубликованные посты (уже существует)

  2. Безопасность
    - Только пользователи с ролью 'admin' могут создавать/изменять/удалять посты
    - Используется функция is_admin() для проверки прав
*/

-- Политика для создания блог-постов (только администраторы)
DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
CREATE POLICY "Admins can insert blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Политика для обновления блог-постов (только администраторы)
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
CREATE POLICY "Admins can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Политика для удаления блог-постов (только администраторы)
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;
CREATE POLICY "Admins can delete blog posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (is_admin());