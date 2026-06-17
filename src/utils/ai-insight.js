// AI 解读工具 — 调用 Supabase Edge Function 代理阿里百炼 API
// 前端无需 API Key，所有用户都能用

const SUPABASE_FUNCTION_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

// -------- 内置模板解读（后端不可用时的 fallback）--------
const TEMPLATES = {
  'instinct-hand': (data) => {
    const picked = data.result || data.caughtLabel || '你的选择';
    const question = data.question || '';
    const time = data.time ? `${data.time.toFixed(1)}秒` : '';
    return `## 🎯 本能式选择背后的真相

你在极短的时间内选择了「${picked}」${time ? `（仅用了${time}）` : ''}。这不是冲动——这是你的直觉系统在为你工作。

**心理学告诉你：**
人在面对选项过多的复杂决策时，大脑边缘系统（负责情绪和直觉）会在前额叶皮层（负责理性推演）之前完成信息处理。你抓取的那个光团，本质上是你内心已经排好优先级的那个答案。

**接下来可以做的：**
1. 不要立刻推翻这个直觉结果——先认真感受它带来的情绪
2. 问问自己："如果这就是答案，我能接受吗？"
3. 如需理性验证，以这个结果为基准列出接受和拒绝的理由

> 理性的价值是验证，直觉的价值是方向。两者都不可偏废。`;
  },

  'parallel-letters': (data) => {
    const optionA = data.optionA || '';
    const optionB = data.optionB || '';
    return `## 📮 时间维度下的决策透镜

你为自己设想了不同选择后的未来——这本身就是一种非常成熟的决策思维。

**为什么有效：**
行为经济学中有一个概念叫"心理模拟"。当你在头脑中生动地想象未来场景时，大脑会激活与实际体验相似的神经回路，让你更真实地感受到那个选择的情感价值。

**思考练习：**
1. 三封信中，哪一封让你心跳加速？那是渴望在说话
2. 哪一封让你感到安心？那是安全感的需求
3. 渴望和安全感的交汇处，往往藏着最佳方案

> 好的选择，是让你既兴奋又踏实的那个。`;
  },

  'friend-room': (data) => {
    return `## 🔮 他人是面镜子

朋友的回答可能让你意外，也可能正中你的心事。无论哪种，"镜中我"理论告诉我们：我们对自己的认知很大程度上来自他人的反馈。朋友看到的你，可能比你看到的自己更接近真实。

**关于结果的解读：**
真正重要的不是建议本身，而是你在阅读建议时的内心反应——你对哪个反馈点头？哪个让你想反驳？这些身体反应比说出来的话更真实。

> 别人给的是建议，你能听进去哪些，才是答案。`;
  },

  'reverse-fear': (data) => {
    const kept = data.kept || [];
    const removed = data.removed || [];
    const keptList = Array.isArray(kept) ? kept.join('、') : kept;
    const removedList = Array.isArray(removed) && removed.length > 0 ? removed.join('、') : '';
    return `## 🃏 恐惧清单暴露的价值观

你留下了「${keptList}」${removedList ? `，删去了「${removedList}」` : ''}。"损失厌恶"是人最基本的心理倾向之一——每一次删除都是在告诉你：这件事的代价你不愿承担。

你最终保留的——不是因为最完美，而是因为代价对你"可以接受"。这种底线思维往往比追逐最优解更可靠。

> 真正的勇敢，不是不害怕失去——而是清楚自己不能失去什么。`;
  },

  'value-auction': (data) => {
    const bids = data.bids || {};
    const topValues = Object.entries(bids).sort(([, a], [, b]) => b - a).slice(0, 3);
    return `## ⚖️ 你的价值观排序

${topValues.length > 0 ? `你用了最多的金币拍下了这些价值——选项会变，但你的价值偏好是稳定的，它会在未来每一个十字路口继续影响你。` : ''}

多属性决策理论告诉我们：当把"我该选什么"转化为"我最看重什么"时，决策难度会大大降低。拍卖让你看见了自己心中的权重体系。

> 你不会永远面对同一个选择。但你会一直带着同一套价值。`;
  },
};

// -------- 调用 Supabase Edge Function --------
async function callEdgeFunction(gameType, data) {
  const prompts = {
    'instinct-hand': `用户使用"本能之手"做了一个快速直觉选择。问题："${data.question}"。最终在${data.ballCount || ''}个选项中本能选择了"${data.caughtLabel || data.result}"（用时${data.time ? data.time.toFixed(1) + '秒' : '很短'}）。请分析这个直觉结果的含义，给用户正向引导。`,
    'parallel-letters': `用户使用"平行时空来信"比较"${data.optionA}"和"${data.optionB}"并阅读了未来信件。请从心理模拟角度分析这种决策方式的优势。`,
    'friend-room': `用户通过"朋友灵魂拷问室"获取了朋友的建议。问题："${data.question}"。请从镜中我理论分析外部反馈的价值。`,
    'reverse-fear': `用户使用"反向恐惧清单"排除了${(data.removed || []).length}个选项，保留了"${Array.isArray(data.kept) ? data.kept.join('、') : data.kept}"。请从底线思维角度分析。`,
    'value-auction': `用户使用"价值天平拍卖会"决定"${data.question}"，结果倾向"${data.result}"。请从价值函数角度分析用户偏好。`,
  };

  const prompt = prompts[gameType];
  if (!prompt) return null;

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 400,
      }),
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
export async function generateInsight(gameType, data) {
  // 优先走 Supabase Edge Function（百炼 AI）
  const aiResult = await callEdgeFunction(gameType, data);
  if (aiResult) return aiResult;

  // Fallback to templates
  const templateFn = TEMPLATES[gameType];
  if (templateFn) return templateFn(data);
  return null;
}
