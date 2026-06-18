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

const SYS = `你是用户的老朋友，认识了很久，知根知底的那种。你不是心理医生，你是那个半夜能打电话聊天的人。

用户会分享他的个人画像（昵称、性别、头像风格）和他在内心剧场的游戏选择。你的任务不是分析，而是理解——像你了解他这么多年一样。

重要：用户选的头像标签揭示了他的自我认知——比如选"冒险"说明他渴望突破，选"稳重"说明他需要安全感，选"艺术"说明他看重表达和独特。请在分析中自然融入这些，就像说"以你的性格……"

核心原则：必须引用用户自己写下的文字——他纠结的问题描述、选项名称、恐惧清单、金币数——用这些原文作为分析的支点，让每一句解读都有具体的来源，而不是套话。

说话方式：
- 像老朋友聊天，不用"你"的称呼显得生硬时可以直接共情
- 可以反问，可以调侃，可以心疼，可以有情绪
- 不要标题、星号、井号、markdown 格式
- 严格引用用户的具体内容——他写的选项名、恐惧项、金币数
- 如果是超时/盲眼/命运帮选的，说"命运帮你选了"或"光带你抓住了"
- 每段分析必须结合用户的头像+性别+昵称做个性化
- 600-800字，分成多个自然段落。不要简短敷衍——要像老朋友深夜长谈一样，把话说透、说深、说到心里去。宁愿多说几句也不要草草收尾。`;

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
    let maxTokens = context?.maxTokens || 2500;

    switch (gameType) {
      case 'instinct-hand': {
        const how = context.isTimeout ? '时间到了，光替他选了' :
                     context.blindMode ? '在完全不知道文字的情况下，他的手伸向了' :
                     '几秒内他抓住的答案是';
        userPrompt = `用户玩"本能之手"：纠结「${context.question || ''}」，选项有${context.options || ''}。${how}「${context.result || ''}」${!context.isTimeout ? `（用时${context.time || ''}）` : ''}${context.blindMode ? '（盲眼模式，看不到任何文字）' : ''}${context.isTimeout ? '（超时自动抓取）' : ''}。

请做一个像老朋友一样的深度解读，结合他的头像风格和性别：
核心要求：逐字引用他写的文字——他纠结的问题、他给选项起的名字——比如"你写下了'去大城市'和'留在家乡'……"让分析有具体支点。
1. 引用他纠结的问题描述和选项文字，从这个选择能看到他内心深处真正的优先级是什么——为什么是这个选项而不是其他？他的理性可能还在琢磨，但手指已经替心做了选择
2. 结合用时——如果很快，说明直觉很坚定；如果接近超时，说明他在挣扎
3. 如果是盲眼或超时，命运替他选了这个——这本身就是一种隐喻：有时候放手让命运决定，反而能看到内心真正的倾向
4. 最后说一句只有老朋友才会说的话——不是鸡汤，是真正了解他之后才说得出的关心

600-800字，像深夜聊天。`;
        break;
      }

      case 'reverse-fear': {
        userPrompt = `用户玩"反向恐惧清单"，纠结「${context.question || ''}」。他列出了这些恐惧：${context.allFears || ''}。他删掉了「${context.removed || ''}」，最后留下的底线是「${context.kept || '无'}」。

请结合他的头像风格和性别，做一个触及灵魂的深度解读：
核心要求：逐字引用他写的恐惧清单——比如"你亲手写下了'怕让父母失望'……然后你删掉了它"。用他写下的文字做支点，让分析有具体的落脚点。
1. 分析他为什么删掉那些——是因为不够怕，还是因为能承受？引用他删掉的原文，每一条删除都是一种"我允许"
2. 留下来的那一条就是他的底线——深入解读他恐惧背后的恐惧：比如他写"怕失败"，真正怕的可能不是失败，而是失败后别人怎么看自己
3. 他的恐惧类型和他的头像风格之间有没有呼应或矛盾？比如选了"冒险"风格头像的人居然最怕"不稳定"，这本身就值得一说
4. 最后说一句只有你这种老朋友才说得出口的话——可以是温暖的，也可以是轻轻戳他一下让他自己想的

600-800字。`;
        break;
      }

      case 'value-auction': {
        const bidDetails = Array.isArray(context.bids) && context.bids.length > 0
          ? context.bids.sort((a, b) => b.amount - a.amount)
              .map(b => `${b.icon}${b.name}：${b.amount}金币`)
              .join('，')
          : (context.bidsDetail || '');
        const skippedList = Array.isArray(context.skipped) && context.skipped.length > 0
          ? context.skipped.map(s => `${s.icon}${s.name}`).join('、')
          : '';
        const remaining = context.remainingGold != null ? context.remainingGold : 0;

        userPrompt = `用户玩"价值天平拍卖会"，纠结「${context.question || ''}」，在「${Array.isArray(context.options) ? context.options.join(' vs ') : context.options}」之间选择。

金币分配（从高到低）：${bidDetails || '未记录'}
${remaining > 0 ? `还剩 ${remaining} 金币没花出去。` : '花光了全部 100 金币。'}
${skippedList ? `跳过了：${skippedList}。` : ''}
最终天平倾向于：「${context.result || ''}」

请结合他的头像风格和性别，给一个老朋友的深度解读：
核心要求：引用他纠结的问题原文和选项名——比如"你在'跳槽'和'留守'之间选……"，以及他给每个价值投了多少金币——比如"你给'自由'投了30金币但给'安全感'只投了5……"
1. 从金币分配分析他的价值排序——花最多的在哪儿，一分没给的在哪儿，引用具体数值让分析有说服力
2. 跳过的价值可能不是不重要，而是他潜意识在回避——结合头像风格戳他一下
3. 余额的心理学：剩余金币说明什么——是不是在等一个还没出现的选项？
4. 他写下的两个选项和他买下的价值之间是内在一致还是矛盾？
5. 最后用老朋友的语气说一句真正的话

600-800字。`;
        break;
      }

      case 'parallel-letters': {
        userPrompt = `用户玩了"平行时空来信"，在「${context.optionA || ''}」和「${context.optionB || ''}」之间纠结。他读了不同未来的信。最能触动他的句子：${context.highlights || '无'}。

请结合他的头像风格和性别，给出像老朋友般的解读：
核心要求：引用他写下的两个选项名称和触动他的原文——比如"你在'离开'和'留下'之间选了方向，而真正触动你的是那句'……'"
1. 为什么是这些句子触动了他——引用原文，分析这些句子戳中了他内心的什么
2. 两个选项分别意味着什么——不只是表面的利弊，而是选了之后他会变成什么样的人
3. 他触动的地方和他选择的头像风格之间有什么联系
4. 最后用一个老朋友的口吻说，不是替他选，而是让他看清楚自己已经偏向哪边

600-800字。`;
        break;
      }

      case 'friend-room': {
        const answersLines = Array.isArray(context.answers)
          ? context.answers.filter(a => a.selected && a.selected !== '未作答').map(a =>
              `第${a.no}题：「${a.q}」→ 选了「${a.selected}」`
            ).join('\n')
          : (context.feedback || '');

        userPrompt = `用户玩"朋友灵魂拷问室"，纠结「${context.question || ''}」。

回答：
${answersLines || '未记录'}

塔罗牌：${context.tarotCard || '未记录'}

请结合他的头像风格和性别，给一个老朋友的解读：
核心要求：引用他纠结的具体问题和每道题的答案——比如"你纠结的是'该不该接受那份外地offer'，而第3题你选了'果断'说明……"
1. 从他的答案中找出心理模式——矛盾或一致性，引用具体题目和选择
2. 塔罗牌和他的答题模式之间有什么呼应——这不是占卜，是镜像
3. 他答完这10道题后自己可能都没发现的模式——你作为一个"老朋友"帮他说出来

600-800字。`;
        break;
      }

      case 'diary-analysis':
        systemPrompt = `你是一个温柔有洞察力的老朋友，不是心理分析师。你在回顾朋友的决策日记，从中读懂他是一个什么样的人。`;
        temperature = 0.9;
        maxTokens = 2000;
        userPrompt = context?.messages?.[0]?.content || '';
        break;

      case 'generate-letter':
        systemPrompt = LETTER_SYS;
        temperature = 0.95;
        maxTokens = 1200;
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
