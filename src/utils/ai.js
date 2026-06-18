// AI 工具 — 平行时空来信 + 解读
// 统一走 Supabase Edge Function → 百炼多模型自动 fallback

const SUPABASE_FUNCTION_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

export async function generateFutureLetter(optionA, optionB, profile = null) {
  const years = [1, 3, 10];

  try {
    const results = await Promise.all(
      years.map(async (year) => {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: 'generate-letter',
            context: { optionA, optionB, year, profile },
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
  const theChoice = Math.random() > 0.5 ? (optionA || '这条路') : (optionB || '那条路');
  const letters = {
    1: `诶，想跟你说个事。

选了「${theChoice}」之后那两个月其实挺难的——跟我想的不太一样。但你知道吗，第三个月开始慢慢就对劲了。我没有变成我以为的那种人，但我成了现在这个我觉得还行的自己。

别怕选错。你现在怕的那些事，大部分都没发生。发生的那些，回头一看也不算什么。\n\n—— 来自一年后`,
    3: `说来好笑。

三年前选的「${theChoice}」，现在回头看，根本不是"选择"本身改变了什么，而是选了之后你逼自己认真过的每一天。我搬了一次家，学会了做饭（虽然还是很难吃），认识了几个可以半夜不回消息也没关系的朋友。

当时你纠结的那个问题，现在已经不是问题了。不是因为解决了，而是你有更大的问题了——但你也有更多办法了。哈哈哈。\n\n—— 来自三年后`,
    10: `我不叫你"亲爱的你"，太肉麻了。

你选了「${theChoice}」这件事，放在十年这个尺度上看，就跟高中选了理科还是文科一样——它重要，但没你想的那么重要。重要的一直不是选了哪条路，是你在路上变成了什么样的人。

我这十年过得很有意思。去了几个没想过会去的地方，做了几件没想过会做的事，也有无数次后悔和重新来过的时刻。但如果你问我：当初该选另一个吗？我不知道——因为我没走过那条路。我只知道我走的这条路，最后没那么差。\n\n—— 来自十年后`,
  };
  return letters[year] || letters[1];
}
