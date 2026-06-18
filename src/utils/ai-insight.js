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
  const parsed = JSON.parse(d.content);
  return Array.isArray(parsed) ? parsed : (() => { throw new Error('题目格式错误'); })();
}
