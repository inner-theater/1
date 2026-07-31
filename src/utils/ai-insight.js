// AI 深度解读 — 纯实时调用，无 fallback

const SUPABASE_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbXZwZGJ1aHpmb21mc3RxaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NzU2ODQsImV4cCI6MjA5NzI1MTY4NH0.CSVN_Q-EOIq37D4CkacmuZ7TNcGjzzfYtfF8DP4JQP4';

export async function generateInsight(gameType, context) {
  try {
    const r = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ gameType, context }),
    });
    const d = await r.json();
    if (r.ok && d.content) {
      console.log('[insight] AI 实时解析完成');
      return d.content;
    }
    throw new Error(d.error || 'Edge Function 返回异常');
  } catch (e) {
    console.error('[insight] AI 调用失败:', e.message);
    throw e;
  }
}

export async function generateQuestions(question) {
  const r = await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ gameType: 'generate-questions', context: { question } }),
  });
  const d = await r.json();
  if (!d.content) throw new Error(d.error || '生成题目失败');
  const parsed = extractJSON(d.content);
  if (!parsed || !Array.isArray(parsed)) {
    throw new Error('题目格式错误');
  }
  return parsed;
}

// AI 返回的内容可能是以下任意形式：
// 1. 纯 JSON 数组：        [{...}, {...}]
// 2. markdown 包裹的 JSON：```json\n[...]\n```
// 3. 前后带解释文字的 JSON：xxx\n[{...}]\nxxx
// 下面的 extractJSON 依次尝试三种解析方式
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;
  // 1. 直接 parse
  try { return JSON.parse(text); } catch {}
  // 2. markdown ```json ... ``` 块
  const md = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (md) {
    try { return JSON.parse(md[1]); } catch {}
  }
  // 3. 找第一个看起来像 JSON 数组 / 对象的子串（贪婪匹配到末尾）
  const obj = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (obj) {
    try { return JSON.parse(obj[1]); } catch {}
  }
  return null;
}
