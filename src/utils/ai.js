// AI 工具 — 平行时空来信 + 解读
// 统一走 Supabase Edge Function → 百炼多模型自动 fallback

const SUPABASE_FUNCTION_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbXZwZGJ1aHpmb21mc3RxaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NzU2ODQsImV4cCI6MjA5NzI1MTY4NH0.CSVN_Q-EOIq37D4CkacmuZ7TNcGjzzfYtfF8DP4JQP4';

export async function generateFutureLetter(optionA, optionB, profile = null) {
  const years = [1, 3, 10];
  // 盲测设计：只随机一次，三封信都是同一条路的未来
  const chosen = Math.random() > 0.5 ? (optionA || '这条路') : (optionB || '那条路');
  const other = chosen === optionA ? optionB : optionA;

  const results = await Promise.all(
    years.map(async (year) => {
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          gameType: 'generate-letter',
          context: { optionA, optionB, chosen, year, profile },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `第${year}封信生成失败`);
      }

      return {
        title: `${year}年后的来信`,
        content: data.content,
        year,
        model: data.model,
      };
    })
  );

  return { letters: results, chosen, other };
}
