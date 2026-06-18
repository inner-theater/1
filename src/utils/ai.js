// AI 工具 — 平行时空来信 + 解读
// 统一走 Supabase Edge Function → 百炼多模型自动 fallback

const SUPABASE_FUNCTION_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

export async function generateFutureLetter(optionA, optionB, profile = null) {
  const years = [1, 3, 10];
  // 盲测设计：只随机一次，三封信都是同一条路的未来
  const chosen = Math.random() > 0.5 ? (optionA || '这条路') : (optionB || '那条路');
  const other = chosen === optionA ? optionB : optionA;

  try {
    const results = await Promise.all(
      years.map(async (year) => {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: 'generate-letter',
            context: { optionA, optionB, chosen, year, profile },
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

    // 把 chosen 一起返回，方便解读时揭晓
    return { letters: results, chosen, other };
  } catch (e) {
    console.warn('AI 来信生成失败，使用模拟数据:', e.message);
    return {
      letters: years.map((y) => ({
        title: `${y}年后的来信`,
        content: generateMockLetter(y, chosen, other),
        year: y,
      })),
      chosen,
      other,
    };
  }
}

// 模拟数据（所有模型都不可用时的兜底）—— 基于具体选项生成
function generateMockLetter(year, chosen, other) {
  const letters = {
    1: `选了「${chosen}」之后一整年了。

说真的，跟我想的完全不一样——不是更好，也不是更坏，就是完全不一样。我以为自己会很明确地"做对了"或者"后悔了"，但其实大多数时候根本顾不上想这些。生活用无数具体的事填满了每一天——适应新环境、认识新的人、处理之前没遇到过的问题。偶尔夜深人静会想一下：当初如果选了「${other}」会怎样？但也只是想一下，然后翻身就睡了。

最大的感受是：选择本身没我以为的那么重要。重要的是选了之后我没停在原地。这一年最大的成长不是"选对了"，而是"选了之后一直在走"。你现在怕的那些事大多数不会发生，发生的那些也没有你想的那么可怕。

—— 一年后`,

    3: `嘿，三年了。

当初选「${chosen}」的那个纠结，现在已经不是问题了。不是解决了——是有更大的问题了。成年人的生活就是这样，永远有下一个坎要迈。

这三年里，我做了很多当初没想过的事。选「${chosen}」这条路上有真实的收获——可能是一份工作、一个圈子、一种生活方式，让我变成了一个跟三年前不一样的人。但也有真实的遗憾——偶尔会想，走了「${other}」那条路的人现在在干嘛？他们看到的世界跟我看到的是不是完全不一样？

不过这种遗憾很浅——浅到不会影响我做任何决定。它只是偶尔飘过，像公交车站看到一辆去往不同方向的班车。你上了这辆车，就好好坐到底。风景不一样，但终点站都挺远的。

—— 三年后`,

    10: `十年了，没想到吧。

「${chosen}」跟「${other}」——这对十年前的你来说是整个宇宙。十年后的我可以告诉你：它在人生的长河里的分量，大概就像你高中时选文科还是理科。它改变了一些轨迹，但没有定义你是什么样的人。

真正定义我的，是选了之后每一天的选择——怎么对待工作、怎么对待身边人、在低谷时怎么跟自己对话、被打击后多久爬起来。这些事跟「${chosen}」或「${other}」都没关系。哪条路都会有这些挑战，区别只是它们的包装不一样。

最后说一句：别怕。十年前我怕了太久——怕选错、怕后悔、怕辜负。现在回头看，怕本身才是唯一真正浪费掉的东西。至于选哪条路——选哪条都行，选完走下去就行。

—— 十年后`,
  };
  return letters[year] || letters[1];
}
