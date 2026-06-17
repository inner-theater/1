-- 内心剧场 数据库表

-- 决策日记表（按用户隔离）
CREATE TABLE IF NOT EXISTS decision_diary (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game VARCHAR(100) NOT NULL,
  question TEXT DEFAULT '',
  result TEXT DEFAULT '',
  type VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：按用户查日记
CREATE INDEX IF NOT EXISTS idx_diary_user ON decision_diary(user_id, created_at DESC);

-- Row Level Security：用户只能读写自己的数据
ALTER TABLE decision_diary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own diary" ON decision_diary;
CREATE POLICY "Users can read own diary" ON decision_diary
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own diary" ON decision_diary;
CREATE POLICY "Users can insert own diary" ON decision_diary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 每日 AI 调用计数表
CREATE TABLE IF NOT EXISTS daily_ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

ALTER TABLE daily_ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own usage" ON daily_ai_usage;
CREATE POLICY "Users can read own usage" ON daily_ai_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own usage" ON daily_ai_usage;
CREATE POLICY "Users can upsert own usage" ON daily_ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户画像表（AI 分析结果缓存）
CREATE TABLE IF NOT EXISTS user_insights (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  model_used VARCHAR(100) DEFAULT 'qwen-turbo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own insights" ON user_insights;
CREATE POLICY "Users can read own insights" ON user_insights
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON user_insights;
CREATE POLICY "Users can insert own insights" ON user_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
