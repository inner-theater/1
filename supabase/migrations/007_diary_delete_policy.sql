-- 决策日记 DELETE 策略（之前只有 SELECT/INSERT，导致删除被 RLS 拒绝，
-- 前端删了本地但云端删不掉，刷新后记录又回来）

DROP POLICY IF EXISTS "Users can delete own diary" ON decision_diary;
CREATE POLICY "Users can delete own diary" ON decision_diary
  FOR DELETE USING (auth.uid() = user_id);