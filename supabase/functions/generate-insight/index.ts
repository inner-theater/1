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

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYS = `你是一个温柔、有洞察力的朋友。你的任务是根据用户在内心剧场游戏中的真实选择，给他一段走心的解读。

重要规则：
- 不要用任何标题、星号、井号、markdown格式。就像朋友发消息一样自然。
- 严格基于用户填写的具体内容分析，不要泛泛而谈。
- 如果用户是超时自动选的/盲眼随机选的，不要说"你选择了"，要说"命运帮你选了"或"光替你选了"。
- 如果用户是盲眼模式，要说"在你看不到任何文字的情况下，你的手伸向了..."。
- 控制总字数在150字左右，不要太多。
- 始终温和、鼓励，像深夜聊天。`;

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
    let maxTokens = context?.maxTokens || 300;

    switch (gameType) {
      case 'instinct-hand': {
        const how = context.isTimeout ? '时间到了，光替他选了' :
                     context.blindMode ? '在完全看不到文字的情况下，他的手伸向了' :
                     '他在几秒内主动抓住了';
        userPrompt = `用户玩"本能之手"，纠结「${context.question || ''}」。选项有${context.options || ''}。${how}「${context.result || ''}」（用时${context.time || ''}）。请走心解读，不要标题格式，150字。`;
        break;
      }

      case 'reverse-fear':
        userPrompt = `用户玩"反向恐惧清单"，纠结「${context.question || ''}」。他删除了（可以接受）「${context.removed || '无'}」，保留了底线「${context.kept || '无'}」。他的全部恐惧：${context.allFears || ''}。请走心解读他的底线和恐惧，不要标题，150字。`;
        break;

      case 'value-auction':
        userPrompt = `用户玩"价值天平拍卖会"，纠结「${context.question || ''}」。他的金币分配：${context.bidsDetail || ''}。最终倾向「${context.result || ''}」。请解读他的价值排序意味什么，不要标题，150字。`;
        break;

      case 'parallel-letters':
        userPrompt = `用户读了不同未来的信。纠结「${context.optionA || ''}」和「${context.optionB || ''}」。他标记了这些句子被触动：${context.highlights || '无'}。请温暖鼓励，不要标题，150字。`;
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
        userPrompt = `以"${context.year}年后的你"身份写信。选项A：${context.optionA}，B：${context.optionB}。选一个，想象${context.year}年后生活。字数${context.year===1?'200':context.year===3?'300':'400'}字。`;
        break;

      case 'generate-questions': {
        systemPrompt = `你是一个创意十足的灵魂拷问者。为用户纠结的问题设计个性选择题。直接输出JSON数组，不要任何其他文字。`;
        temperature = 0.9;
        maxTokens = 800;
        userPrompt = `用户纠结：「${context.question || ''}」。请生成10个灵魂拷问选择题，每道题4个选项（A/B/C/D）。要结合他的具体问题来设计，不要泛泛而谈。输出格式严格为JSON数组：[{"q":"题面","options":["A.选项一","B.选项二","C.选项三","D.选项四"]},...]`;
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
