/*
  # Drop Unused Indexes
  
  1. Performance Optimization
    - Removes unused indexes that consume storage and slow down writes
    - Indexes can be re-added later if query patterns change
    
  2. Indexes Being Removed:
    - **lessons table**: idx_lessons_course_id (appears to be from old schema)
    - **blog_posts table**: idx_blog_posts_slug, idx_blog_posts_published, idx_blog_posts_category, idx_blog_posts_author_id
    - **enrollments table**: idx_enrollments_course_id
    - **lesson_progress table**: idx_lesson_progress_lesson_id
    - **course_lessons table**: idx_course_lessons_course_id
    - **user_subscriptions table**: idx_user_subscriptions_user_id, idx_user_subscriptions_active
    - **course_purchases table**: idx_course_purchases_user_id, idx_course_purchases_course_id
    
  3. Notes:
    - These indexes were flagged as unused by the database statistics
    - Foreign key indexes and commonly-queried fields still benefit from indexes as data grows
    - Monitor query performance and re-add indexes if needed
*/

-- Drop indexes on lessons table (old schema)
DROP INDEX IF EXISTS idx_lessons_course_id;

-- Drop indexes on blog_posts table
DROP INDEX IF EXISTS idx_blog_posts_slug;
DROP INDEX IF EXISTS idx_blog_posts_published;
DROP INDEX IF EXISTS idx_blog_posts_category;
DROP INDEX IF EXISTS idx_blog_posts_author_id;

-- Drop indexes on enrollments table
DROP INDEX IF EXISTS idx_enrollments_course_id;

-- Drop indexes on lesson_progress table
DROP INDEX IF EXISTS idx_lesson_progress_lesson_id;

-- Drop indexes on course_lessons table
DROP INDEX IF EXISTS idx_course_lessons_course_id;

-- Drop indexes on user_subscriptions table
DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS idx_user_subscriptions_active;

-- Drop indexes on course_purchases table
DROP INDEX IF EXISTS idx_course_purchases_user_id;
DROP INDEX IF EXISTS idx_course_purchases_course_id;
