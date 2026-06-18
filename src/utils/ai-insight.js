// AI 深度解读 — 纯实时调用，无 fallback

const SUPABASE_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

export async function generateInsight(gameType, context) {
  try {
    const r = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    throw e; // 直接抛出让调用方处理
  }
}

// 生成灵魂拷问题目（无 fallback）
export async function generateQuestions(question) {
  const r = await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameType: 'generate-questions', context: { question } }),
  });
  const d = await r.json();
  if (!d.content) throw new Error(d.error || '生成题目失败');
  const parsed = JSON.parse(d.content);
  return Array.isArray(parsed) ? parsed : (() => { throw new Error('题目格式错误'); })();
}
