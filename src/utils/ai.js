// AI 工具 — 平行时空来信 + 解读
// 统一走 Supabase Edge Function → 百炼多模型自动 fallback

const SUPABASE_FUNCTION_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

export async function generateFutureLetter(optionA, optionB) {
  const years = [1, 3, 10];

  try {
    const results = await Promise.all(
      years.map(async (year) => {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: 'generate-letter',
            context: { optionA, optionB, year },
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '生成失败');

        return {
          title: `${year}年后的来信`,
          content: data.content,
          year,
          model: data.model,
        };
      })
    );

    return results;
  } catch (e) {
    console.warn('AI 来信生成失败，使用模拟数据:', e.message);
    return years.map((y) => ({
      title: `${y}年后的来信`,
      content: generateMockLetter(y, optionA, optionB),
      year: y,
    }));
  }
}

// 模拟数据（所有模型都不可用时的兜底）
function generateMockLetter(year, optionA, optionB) {
  const letters = {
    1: `亲爱的你：\n\n一年了。记得当初站在岔路口的你吗？选择「${optionA || optionB || '这条路'}」之后，你发现成长往往藏在最初的不安里。你学会了在压力下微笑，也遇到了让你眼睛发亮的人。现在的你正喝着咖啡晒太阳，那段辗转反侧的时光，不过是成长的前奏。\n\n—— 一年后的你`,
    3: `三年后的你：\n\n时间是个好东西。你换了城市，做了些勇敢的决定，也有了可以深夜打电话的朋友。最重要的是，你不再那么害怕选错了——因为你知道每条路都有它的风景。当初让你纠结的那个选择，现在回头看不过是人生的一个逗号。\n\n—— 三年后的你`,
    10: `十年后的你：\n\n你好，我是十年后的你。我想告诉你：谢谢你当初认真做了选择。不是因为它多正确，而是因为你在选择之后一直在认真生活。你去了想去的地方，爱了想爱的人，也放下了该放下的。人生从来没有白走的路。\n\n—— 十年后的你`,
  };
  return letters[year] || letters[1];
}
