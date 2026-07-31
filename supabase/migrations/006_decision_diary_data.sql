-- 决策日记表加 data JSONB 列，存各游戏的详细字段
-- （选项、信件、题目、答案、塔罗牌、分数等）
-- 前端 addDiaryEntry 把这些塞 data 一起写，getDiary 时展开回顶层

ALTER TABLE decision_diary
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;