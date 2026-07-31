-- 分享链接表 — 服务端持久化，让朋友扫码能看到题目

CREATE TABLE IF NOT EXISTS share_links (
  code TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_share_links_created ON share_links(created_at DESC);

-- RLS: 公开分享，任何人可读可写
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read share_links" ON share_links;
CREATE POLICY "Anyone can read share_links" ON share_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert share_links" ON share_links;
CREATE POLICY "Anyone can insert share_links" ON share_links
  FOR INSERT WITH CHECK (true);