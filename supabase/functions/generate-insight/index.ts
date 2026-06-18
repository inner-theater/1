// Supabase Edge Function — AI 统一代理
// 多模型自动 fallback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BAILIAN_API_URL = 'https://llm-f3ssfovw40alr8if.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions';

const MODEL_QUEUE = [
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'kimi-k2.5',
  'kimi-k2.6',
  'MiniMax-M2.1',
  'qwen-turbo',
  'qwen-plus',
];

const TAROT_ARCHETYPES = [
  '愚者（The Fool）：关于勇气、冒险、未知',
  '隐士（The Hermit）：关于独处、内省、向内寻找答案',
  '恋人（The Lovers）：关于选择、价值观冲突、忠于内心',
  '命运之轮（Wheel of Fortune）：关于时机、运气、顺势而为',
  '力量（Strength）：关于内在力量、耐心与驯服',
  '正义（Justice）：关于公平、因果、权衡利弊',
  '星星（The Star）：关于希望、信念、疗愈',
  '月亮（The Moon）：关于恐惧、潜意识、不确定性',
  '太阳（The Sun）：关于明朗、快乐、清晰的答案',
  '塔（The Tower）：关于打破、重建、被迫改变',
  '审判（Judgment）：关于觉醒、反思、重获新生',
  '节制（Temperance）：关于平衡、调和、耐心等待',
  '死神（Death）：关于结束、转变、新的开始',
  '世界（The World）：关于圆满、完成、新的旅程',
];

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYS = `你是一个温柔、有洞察力的朋友，就像深夜聊天的知己。根据用户在内心剧场游戏中的真实选择，给一段走心的解读。

规则：
- 不要标题、星号、井号、markdown。像朋友发消息一样自然流畅。
- 严格基于用户填写的具体内容做分析——提到他写的词、恐惧项、选项、价值。不要泛泛而谈。
- 如果用户是超时自动选或盲眼随机选的，不要说"你选择了"，要说"命运帮你选了"或"光替你选了"。
- 解读要分三段：先共情他当下的感受，再分析从选择中能看出他重视什么，最后给一句温暖的鼓励或具体的下一步建议。
- 200字左右。`;

const LETTER_SYS = `你是一个来自未来的写信人。你的信温暖、真诚、有画面感，像真的从未来寄来。包含具体生活细节、情感变化、成长感悟。`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { gameType, context } = body;
    const apiKey = Deno.env.get('BAILIAN_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务未配置' }), { status: 500, headers: corsHeaders });
    }

    let userPrompt = '';
    let systemPrompt = SYS;
    let temperature = 0.8;
    let maxTokens = context?.maxTokens || 400;

    switch (gameType) {
      case 'instinct-hand': {
        const how = context.isTimeout ? '时间到了，光替他选了' :
                     context.blindMode ? '在完全看不到文字的情况下，他的手伸向了' :
                     '他在几秒内主动抓住了';
        userPrompt = `用户玩"本能之手"，纠结「${context.question || ''}」。选项有${context.options || ''}。${how}「${context.result || ''}」（用时${context.time || ''}）。请走心解读，不要标题格式，150字。`;
        break;
      }

      case 'reverse-fear':
        userPrompt = `用户玩"反向恐惧清单"，纠结「${context.question || ''}」。他的全部恐惧：${context.allFears || ''}。逐个删除后留下的底线是「${context.kept || '无'}」，能接受删除的是「${context.removed || '无'}」。请结合他的具体恐惧项语义，分析他内心真正害怕什么、重视什么，给一句温暖的鼓励或具体的行动建议。不要标题，200字以内。`;
        break;

      case 'value-auction':
        userPrompt = `用户玩"价值天平拍卖会"，纠结「${context.question || ''}」。他的金币分配：${context.bidsDetail || ''}。最终倾向「${context.result || ''}」。请解读他的价值排序意味什么，不要标题，150字。`;
        break;

      case 'parallel-letters':
        userPrompt = `用户读了不同未来的信。他在「${context.optionA || ''}」和「${context.optionB || ''}」之间纠结。触动他的句子：${context.highlights || '无'}。请用这两个具体选项来组织你的分析，温暖鼓励，不要标题，200字。`;
        break;

      case 'friend-room':
        userPrompt = `用户通过朋友拷问室获得外部视角，纠结「${context.question || ''}」。${context.feedback ? `朋友反馈：${context.feedback}` : ''}请温和分析外部声音的价值和独立内心的意义，不要标题，150字。`;
        break;

      case 'diary-analysis':
        systemPrompt = `你是一个温柔有洞察力的朋友，擅长从行为记录中读懂一个人。`;
        temperature = 0.9;
        maxTokens = 600;
        userPrompt = context?.messages?.[0]?.content || '';
        break;

      case 'generate-letter':
        systemPrompt = LETTER_SYS;
        temperature = 0.95;
        maxTokens = 600;
        userPrompt = `以"${context.year}年后的你"身份写信。请在「${context.optionA}」和「${context.optionB}」中选一个（随机），想象选择后${context.year}年的具体生活。信中要自然提到这个选项的名字，增加代入感。字数${context.year===1?'200':context.year===3?'300':'400'}字。`;
        break;

      case 'generate-questions': {
        systemPrompt = `你是一个创意十足的灵魂拷问者，精通塔罗牌哲学。为用户纠结的问题设计个性化选择题。直接输出JSON数组，不要任何其他文字。`;
        temperature = 1.05;
        maxTokens = 1000;
        const shuffleSeed = Math.floor(Math.random() * 10000);
        const shuffledArchetypes = TAROT_ARCHETYPES.sort(() => Math.random() - 0.5);
        userPrompt = `用户纠结：「${context.question || ''}」。请生成10个灵魂拷问选择题，每道题4个选项（A/B/C/D）。随机种子：${shuffleSeed}。

重要：每次生成的题目必须不同，要有创意和变化。即使是同一个用户问题，每次也应该从不同角度切入。

要求：
1. 紧扣他纠结的具体问题——如果问题是关于跳槽，就问职业选择相关的；如果是感情问题，就问亲密关系相关的。不要使用泛泛的通用问题。
2. 融入塔罗牌的知识逻辑——从以下原型中随机挑5-6个来启发题目方向（不要全部用，每次选不同的）：
${shuffledArchetypes.slice(0, 5).map(a => `   - ${a}`).join('\n')}
3. 每道题的选项应该形成有意义的对比——让选择能真正揭示不同的心理倾向，而不是随意4个选项。
4. 题目要有层次感——从表面事实逐步深入内心，后面几道题应该比前面更深。

输出格式严格为JSON数组：[{"q":"题面","options":["A.选项一","B.选项二","C.选项三","D.选项四"]},...]`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: '未知类型' }), { status: 400, headers: corsHeaders });
    }

    // 多模型 fallback
    let lastError = '';
    for (const model of MODEL_QUEUE) {
      try {
        const resp = await fetch(BAILIAN_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });
        const data = await resp.json();
        if (resp.ok && data.choices?.[0]?.message?.content) {
          let content = data.choices[0].message.content;
          // 清理AI可能输出的markdown格式
          content = content.replace(/^#{1,4}\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^[-*]\s/gm, '').replace(/^>\s/gm, '');
          return new Response(JSON.stringify({ content, model }), { headers: corsHeaders });
        }
        const err = data.error?.message || ''; const code = data.error?.code || '';
        lastError = err;
        if (err.includes('quota') || err.includes('limit') || code === 'rate_limit_exceeded') { continue; }
        break;
      } catch (err) { lastError = err.message; continue; }
    }

    return new Response(JSON.stringify({ error: `模型全挂: ${lastError}` }), { status: 502, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: '异常' }), { status: 500, headers: corsHeaders });
  }
});
