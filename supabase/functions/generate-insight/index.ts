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

用户会提供他的个人画像（昵称、性别、头像风格），请在分析时自然地结合这些信息——比如他选的头像标签是"探索"，说明他渴望冒险和新奇，这会影响他做决策的潜意识。

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

      case 'value-auction': {
        // bids 全部拍品详情
        const bidDetails = Array.isArray(context.bids) && context.bids.length > 0
          ? context.bids.sort((a, b) => b.amount - a.amount)
              .map(b => `${b.icon}${b.name}：${b.amount}金币`)
              .join('，')
          : (context.bidsDetail || '');
        // skipped 跳过的价值
        const skippedList = Array.isArray(context.skipped) && context.skipped.length > 0
          ? context.skipped.map(s => `${s.icon}${s.name}`).join('、')
          : '';
        const remaining = context.remainingGold != null ? context.remainingGold : 0;

        userPrompt = `用户玩"价值天平拍卖会"，纠结「${context.question || ''}」，在「${Array.isArray(context.options) ? context.options.join(' vs ') : context.options}」之间做选择。

他的金币分配（从高到低）：${bidDetails || '未记录'}
${remaining > 0 ? `⚠️ 注意：他还剩 ${remaining} 枚金币没花出去。` : '💰 他花光了全部100枚金币。'}
${skippedList ? `⏭️ 他跳过了这些价值：${skippedList}。` : '他一个价值都没跳过。'}

最终天平倾向于：「${context.result || ''}」

请结合以上所有信息，做一段直击内心的解读：
1. 从金币分配中分析他真正在意什么——花最多的钱在哪些价值上？花得少的呢？为什么会有这种梯度？
2. 如果有剩余金币，说明什么心理——是在等一个还没出现的价值？还是对前面的选择都没完全投入？
3. 跳过的价值中，有没有哪个其实是他嘴上说不在乎、但潜意识里可能需要的？戳他一下。
4. 他最后的倾向和他买下的价值之间，是内在一致还是有冲突？如果一致，说明他很了解自己；如果冲突，问问他原因。

不要标题，不要markdown，像深夜和一个了解你的朋友聊天一样，可以适当反问让他自己想。250字左右。`;
        break;
      }

      case 'parallel-letters':
        userPrompt = `用户读了不同未来的信。他在「${context.optionA || ''}」和「${context.optionB || ''}」之间纠结。触动他的句子：${context.highlights || '无'}。请用这两个具体选项来组织你的分析，温暖鼓励，不要标题，200字。`;
        break;

      case 'friend-room': {
        const answersLines = Array.isArray(context.answers)
          ? context.answers.filter(a => a.selected && a.selected !== '未作答').map(a =>
              `第${a.no}题：「${a.q}」→ 选了「${a.selected}」`
            ).join('\n')
          : (context.feedback || '');

        userPrompt = `用户玩"朋友灵魂拷问室"，纠结「${context.question || ''}」。

他的回答：
${answersLines || '未记录详细答案'}

他抽到的塔罗牌：${context.tarotCard || '未记录'}

请根据以上完整的问答过程，做一段走心的个性化解读：
1. 结合他每道题的具体答案，分析他的心理倾向——注意他答案中的矛盾和一致性，比如嘴上说害怕风险但身体却选了冒险的选项，或者前后答案展现出某种行为模式
2. 结合塔罗牌的寓意，告诉他这张牌和他的答题模式之间有什么呼应
3. 基于他的选择模式，给一句具体的鼓励或行动建议

不要标题，不要markdown，像朋友深夜聊天一样自然，250字以内。`;
        break;
      }

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

    // 附加用户个人画像信息（头像、性别、昵称），让分析更个性化
    const profile = context.profile;
    if (profile && userPrompt && gameType !== 'generate-questions' && gameType !== 'generate-letter') {
      const profileLines: string[] = [];
      if (profile.nickname) profileLines.push(`昵称：${profile.nickname}`);
      if (profile.gender) profileLines.push(`性别：${profile.gender === 'male' ? '男生' : '女生'}`);
      if (profile.avatarLabel) profileLines.push(`头像选择了「${profile.avatarLabel}」风格`);
      if (profileLines.length > 0) {
        userPrompt += `\n\n关于用户自己：${profileLines.join('，')}。请在分析时自然地结合这些信息——头像风格反映了他的自我认知或向往。`;
      }
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
