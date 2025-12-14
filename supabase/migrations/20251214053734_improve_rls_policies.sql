/*
  # Improve RLS Policies

  This migration improves the Row Level Security policies by separating them into individual operations (SELECT, INSERT, UPDATE, DELETE) instead of using FOR ALL. This follows security best practices and provides more granular control.

  ## Changes Made
  
  1. Drop existing FOR ALL policies
  2. Create separate policies for each operation:
     - SELECT policies: Use USING clause only
     - INSERT policies: Use WITH CHECK clause only
     - UPDATE policies: Use both USING and WITH CHECK
     - DELETE policies: Use USING clause only

  ## Security Improvements
  
  - More granular access control
  - Clearer policy intent
  - Better audit trail
  - Easier to modify individual operations
*/

-- Drop existing FOR ALL policies
DROP POLICY IF EXISTS "Users can manage their own planners" ON planners;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage subtasks of their own tasks" ON subtasks;
DROP POLICY IF EXISTS "Users can manage their own task history" ON task_history;
DROP POLICY IF EXISTS "Users can manage their own courses" ON courses;
DROP POLICY IF EXISTS "Users can manage exams for their own courses" ON exams;
DROP POLICY IF EXISTS "Users can manage their own schedule items" ON schedule_items;
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON chat_messages;

-- Planners policies
CREATE POLICY "Users can view their own planners"
  ON planners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own planners"
  ON planners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planners"
  ON planners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planners"
  ON planners FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Subtasks policies
CREATE POLICY "Users can view subtasks of their own tasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create subtasks for their own tasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks of their own tasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks of their own tasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Task history policies
CREATE POLICY "Users can view their own task history"
  ON task_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task history"
  ON task_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task history"
  ON task_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task history"
  ON task_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Users can view their own courses"
  ON courses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Exams policies
CREATE POLICY "Users can view exams for their own courses"
  ON exams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exams for their own courses"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exams for their own courses"
  ON exams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exams for their own courses"
  ON exams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Schedule items policies
CREATE POLICY "Users can view their own schedule items"
  ON schedule_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule items"
  ON schedule_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule items"
  ON schedule_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule items"
  ON schedule_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);