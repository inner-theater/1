// AI 深度解读 — 调用 Supabase Edge Function + 多模型 fallback

const SUPABASE_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

async function callAI(gameType, context) {
  try {
    const r = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType, context }),
    });
    const d = await r.json();
    return r.ok ? d.content : null;
  } catch { return null; }
}

export async function generateInsight(gameType, context) {
  const ai = await callAI(gameType, context);
  if (ai) return ai;
  return fallback(gameType, context);
}

function fallback(gameType, c) {
  const { question, result, kept, removed, time, blindMode, isTimeout, allFears } = c || {};
  switch (gameType) {
    case 'instinct-hand': {
      const how = isTimeout ? '时间到了，光替你选了' : blindMode ? '在完全不知道的情况下，你的手伸向了' : '你的手指在极短的时间里抓住了';
      return `${how}「${result || '它'}」${time ? `，只用了${time}` : ''}。这背后有一个很真实的东西——你的潜意识早就排好了优先级，只是理性一直在犹豫。不妨静下来问问自己，看到这个结果的那一刻，你心里是松了一口气，还是咯噔了一下？那个真实的反应，比一切都重要。`;
    }
    case 'reverse-fear':
      return `你删掉了${removed ? `「${removed}」` : '一些东西'}，留下了「${kept || '它'}」作为底线。你知道吗，一个人能承受什么，往往比想要什么更能说明他的价值观。留下来的那个，不是因为最完美，而是因为失去它你会最难受。保护好自己的底线，那就是你在这件事上最坚定的方向。`;
    case 'value-auction':
      return `你把金币投给了自己最看重的那些价值。这其实比最后匹配到的答案更值得留意——因为选项会变，但你的价值偏好是稳定的，它会在你未来的每一个十字路口继续影响你。下次纠结的时候，先问问自己：这个选择，在支持我的核心价值吗？`;
    case 'parallel-letters':
      return `不管最终选「${c?.optionA || 'A'}」还是「${c?.optionB || 'B'}」，三封信里打动你的那些句子，其实已经告诉了你答案——它们就是你心里柔软的地方。你在乎的不是结果本身，而是未来能不能有温度、有故事、有成长。这比选哪个都重要。`;
    case 'friend-room':
      return `朋友的声音是一面镜子。你在镜子里点头还是皱眉，比镜子说了什么更重要。听听朋友怎么说，但最后一定要问问自己：我心里真正想走的是哪条路？`;
    default:
      return '每一次认真面对自己的选择，你都在变好。这个决定本身，就值得被看见。';
  }
}

export { };

// 生成灵魂拷问题目
export async function generateQuestions(question) {
  try {
    const r = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType: 'generate-questions', context: { question } }),
    });
    const d = await r.json();
    if (d.content) {
      const parsed = JSON.parse(d.content);
      return Array.isArray(parsed) ? parsed : null;
    }
    return null;
  } catch { return null; }
}
