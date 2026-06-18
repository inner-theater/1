-- 人生决策博物馆 — 公共可见

-- 展品表（所有人可读，登录用户可发布）
CREATE TABLE IF NOT EXISTS museum_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_museum_created ON museum_items(created_at DESC);

-- RLS: 任何人可读
ALTER TABLE museum_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read museum" ON museum_items;
CREATE POLICY "Anyone can read museum" ON museum_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can insert museum" ON museum_items;
CREATE POLICY "Auth users can insert museum" ON museum_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 点赞记录表（每人每展品每天限一次）
CREATE TABLE IF NOT EXISTS museum_likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES museum_items(id) ON DELETE CASCADE,
  liked_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 唯一约束：同一用户同一天不能重复点赞同一展品
CREATE UNIQUE INDEX IF NOT EXISTS idx_museum_likes_unique
  ON museum_likes(user_id, item_id, liked_at);

ALTER TABLE museum_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own likes" ON museum_likes;
CREATE POLICY "Users can read own likes" ON museum_likes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own likes" ON museum_likes;
CREATE POLICY "Users can insert own likes" ON museum_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
