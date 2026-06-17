// AI 深度解读 — 调用 Supabase Edge Function + 百炼
// 根据用户填写的具体内容、操作行为、删除/保留项进行个性化心理分析

const SUPABASE_FUNCTION_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

// -------- 调用 Supabase Edge Function --------
async function callEdgeFunction(gameType, context) {
  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType, context }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.warn('Edge Function 返回异常:', result.error);
      return null;
    }

    return result.content;
  } catch (err) {
    console.warn('Edge Function 调用失败:', err.message);
    return null;
  }
}

// -------- 主入口 --------
export async function generateInsight(gameType, context) {
  const aiResult = await callEdgeFunction(gameType, context);
  if (aiResult) return aiResult;

  // 后端不可用时用模板兜底
  return getFallbackTemplate(gameType, context);
}

// -------- 兜底模板 --------
function getFallbackTemplate(gameType, context) {
  const { question, result, kept, removed, time, allFears } = context;

  switch (gameType) {
    case 'instinct-hand':
      return `在多个选项中，你的手本能地伸向了「${result || '它'}」${time ? `（仅${time}）` : ''}。

这不是偶然。大脑的边缘系统在处理复杂选择时，会在你意识到之前完成价值排序。你抓住的那个，是潜意识投票胜出的答案。

不过，直觉是信号，不是终点。你可以问问自己：如果这就是最终答案，你是松了一口气，还是心里一紧？那个真实的反应，比任何分析都重要。`;

    case 'reverse-fear': {
      const keptList = Array.isArray(kept) ? kept.join('、') : kept;
      const removedList = Array.isArray(removed) && removed.length > 0 ? removed.join('、') : '';
      return `你列出了恐惧，然后一个一个删去，最后留下了「${keptList}」${removedList ? `——而「${removedList}」的代价你能承受` : ''}。

这个过程非常有力量。你知道吗，"你能承受什么"往往比"你想要什么"更接近你的真实自我。你留下的不是"最优解"，而是"最不愿意失去的底线"。而底线，就是价值观的另一种说法。

接下来可以做的：把最后留下的那一项写下来，问自己——如果做这个选择，五年后的我会怎么评价今天的自己？`;
    }

    case 'value-auction':
      return `你把金币投给了那些最重要的价值——这些权重在你心里早已排好，拍卖只是让它们浮出了水面。

多属性决策理论告诉我们，当一个决策牵涉多个维度时，把问题从"我该选什么"转化为"我最看重什么"，答案会自然浮现。你今天的拍卖结果，其实也是你未来所有决策的导航仪。

建议你把这几个核心价值记在备忘录里，下次纠结时先问问自己：这个选项在支持我的核心价值吗？`;

    case 'parallel-letters':
      return `你让AI帮你看见了不同选择后的未来——这种"心理模拟"本身就说明你是个认真对待人生的人。你不只是在选对错，你在感受不同版本的人生。

三封信里打动你的那些句子，不是AI写的有多好，而是它们正好碰到了你心里某个柔软的地方。那就是你的答案所在。

不管你最终选哪个，从这些信件里你已经确认了一件事：你希望未来的人生有温度、有故事、有成长。这比选A还是选B重要得多。`;

    case 'friend-room':
      return `朋友的视角像一面镜子。你在镜子里看到的反应——点头还是皱眉、认同还是反驳——比镜子说了什么更重要。

"镜中我"理论提醒我们：自我认知很大程度来自他人反馈。但最终的决定必须来自内部。朋友的声音是参考，你心里那股"其实我早就知道"的感受，才是答案。`;

    default:
      return '每个选择都是一次自我发现。你愿意花时间认真面对它，这本身就已经在变好了。';
  }
}

export { };
