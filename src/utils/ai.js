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
  const yearTag = year === 1 ? '一年' : year === 3 ? '三年' : '十年';

  const letters = {
    1: `嘿，一年了。\n\n选了「${theChoice}」之后那两个月其实挺难的——跟我想的完全不一样。我搬来了一个租的房子，窗户正对着一条窄窄的巷子，每天早上被楼下卖包子的声音叫醒。起初我以为自己选错了，每天晚上都在想"如果当初选了另一个会怎样"。\n\n但你知道吗，第三个月开始慢慢就对劲了。不是生活变得完美了——房子还是会漏水，工作上也有让人头疼的事——而是我不再老想着"另一个选择"了。我开始认真吃早饭、开始在周末逛菜市场、开始跟楼下的咖啡店老板成为朋友。这些看起来跟"选择"无关的事，其实都是选择之后才会发生的。\n\n我没有变成我以为的那种人——没有特别的厉害，也没有特别糟糕。但我是我自己。这一点比什么都值得。你现在最怕的那些事，大部分都没发生。发生的那些，回头看也不算什么。别怕。\n\n—— 来自一年后`,

    3: `说来好笑。\n\n三年了。三年前你坐在那儿纠结「${theChoice}」的时候，肯定没想到三年后我在这个城市、干这份工作、身边是这群人。我搬了两次家，现在住的房子有个小阳台，我种了一盆不怎么活的薄荷和一盆怎么都死不了的绿萝。学会了做饭——虽然还是不太好吃，但能喂饱自己和偶尔来蹭饭的朋友。\n\n"${theChoice}"这件事，我今天想起它的时候是什么感觉？不是"选对了"或者"选错了"——而是它已经不那么重要了。让我开心的不是当初选了哪条路，而是选了之后我没停在原地。我走出去、试了、摔了、爬起来、继续走。这三年的每一天，都比当初那个决定本身更值得。\n\n你当时担心自己会后悔。我现在可以告诉你——偶尔确实会有点遗憾，看到别人走另一条路时也会有片刻的羡慕。但它们很短，短到下一秒就被手头的琐事冲散了。真正的后悔不会让你有心思种薄荷，不会让你有心情请朋友来吃难吃的饭。你挺好的。\n\n—— 来自三年后`,

    10: `我不叫你"亲爱的你"，太肉麻了。\n\n十年后的某个周六下午，我刚健完身回来，路上忽然想起你——想起十年前那个坐在屏幕前纠结的自己。那一刻的感觉很奇怪，不是心疼，不是遗憾，是一种很温柔的"原来如此"。\n\n你选了「${theChoice}」这件事，放在十年这个尺度上看，就跟高中选了理科还是文科一样——它确实改变了一些轨迹，但没有你当时想的那样定义一切。我这十年去过几个没想过会去的地方，爱过几个人，失去过几个人，也养过一只从垃圾桶边捡回来的橘猫。它陪我搬了三次家，最后一次搬家的时候它已经老得跳不上窗台了，我给它搭了个小台阶。\n\n我想跟你说的是——你现在的那些纠结，那些选择题，十年后不会消失。你还是会遇到更难的选择。但你不会再像现在这样怕了。不是因为你知道答案，而是因为你知道没有完美答案。走哪条路都是对的，只要你走下去。走哪条路都会有遗憾，但这不意味着你该走另一条。\n\n我唯一后悔的是——十年前花了太多时间害怕。如果可以，我希望你少怕一点。不是少想一点——多想是好的——而是少怕一点。怕解决不了任何事，但路上的一碗面、一只猫、一个人、一句真心话，都可以。\n\n—— 来自十年后`,
  };
  return letters[year] || letters[1];
}
