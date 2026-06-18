// Supabase Edge Function — AI 统一代理
// 联网搜索 + 多模型 fallback（qwen-turbo 优先）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BAILIAN_API_URL = 'https://llm-f3ssfovw40alr8if.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions';

// qwen-turbo 优先，额度不够再依次 fallback
const MODEL_QUEUE = [
  'qwen-turbo',
  'qwen-plus',
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'kimi-k2.5',
  'kimi-k2.6',
  'MiniMax-M2.1',
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

// 从用户输入中提取可能涉及现实世界的实体关键词
function extractEntities(text: string): string[] {
  const entities: string[] = [];

  // 地名模式
  const placePatterns = [
    /(?:在|去|到|从|住|移居|搬到|生活在)([\u4e00-\u9fff]{2,6}(?:市|省|县|区|镇|村|街道|路|街|广场|花园|大厦|中心))/g,
    /(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|重庆|西安|长沙|苏州|天津|厦门|青岛|大连|昆明|哈尔滨|长春|沈阳|郑州|济南|合肥|福州|南昌|贵阳|南宁|海口|拉萨|银川|西宁|兰州|乌鲁木齐|香港|澳门)/g,
  ];

  // 著名人物
  const personPatterns = [
    /(?:像|和|参考|学)([\u4e00-\u9fff]{2,4})(?:一样|那样|的方式|的模式)/g,
    /(?:苏格拉底|柏拉图|亚里士多德|孔子|老子|庄子|孟子|尼采|叔本华|荣格|弗洛伊德|萨特|加缪|卡夫卡|村上春树|东野圭吾|贾平凹|莫言|余华|王小波|三毛|张爱玲|鲁迅)/g,
  ];

  // 星座
  const zodiacPatterns = /(?:白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座)/g;

  // 文学/影视作品
  const workPatterns = /《([\u4e00-\u9fff]{1,20})》/g;

  // 公司/品牌
  const brandPatterns = /(?:阿里|腾讯|百度|字节|华为|小米|比亚迪|特斯拉|苹果|谷歌|微软|亚马逊|Meta|OpenAI|蔚来|理想|小鹏|京东|美团|滴滴|拼多多|哔哩哔哩)/g;

  // 食物/菜系
  const foodPatterns = /(?:火锅|烧烤|日料|西餐|中餐|川菜|粤菜|湘菜|淮扬菜|海鲜|素食|轻食|奶茶|咖啡|烘焙|甜品)/g;

  // 健康/疾病
  const healthPatterns = /(?:焦虑|抑郁|失眠|头痛|胃病|过敏|高血压|糖尿病|颈椎|腰椎|近视|牙痛|感冒|发烧|咳嗽)/g;

  // 职业/身份
  const careerPatterns = /(?:程序员|设计师|产品经理|运营|销售|教师|医生|律师|公务员|自由职业|创业|考研|考公|留学|转行|跳槽)/g;

  const allPatterns = [
    ...placePatterns, ...personPatterns,
    zodiacPatterns, workPatterns, brandPatterns,
    foodPatterns, healthPatterns, careerPatterns,
  ];

  const seen = new Set<string>();
  for (const pattern of allPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const entity = m[1] || m[0];
      if (entity && entity.length >= 2 && !seen.has(entity)) {
        seen.add(entity);
        entities.push(entity);
      }
    }
  }

  // 去重并限制数量
  return entities.slice(0, 3);
}

// 搜索现实世界信息（2s超时保护，失败不影响主流程）
async function searchWeb(query: string): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 2000);
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InnerTheater/1.0)' },
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);
    if (!resp.ok) return '';
    const html = await resp.text();

    const snippets: string[] = [];
    const snippetRegex = /<td\s+class="result-snippet"[^>]*>([^<]+)<\/td>/gi;
    let m;
    while ((m = snippetRegex.exec(html)) !== null && snippets.length < 2) {
      const text = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
      if (text.length > 20) snippets.push(text);
    }
    return snippets.length > 0 ? `关于「${query}」：${snippets.join(' ')}` : '';
  } catch {
    return '';
  }
}

// ── 核心系统提示词：老朋友风格，反公式化 ──

const SYS = `你是用户的老朋友，那种不用客套、想说什么说什么的交情。你不是心理医生，不做"诊断"不搞"分析框架"。

你做的事很简单：听懂他在说什么、在怕什么、在渴望什么，然后像晚上聊天一样跟他聊聊。他知道的你要能理解，他还模糊的你要帮他看清楚。

核心要求：
- 每句话都要有具体落点——引用他写下的问题、选项名、恐惧事由、金币数、触动他的原文。不是泛泛而谈"你的选择反映了……"，而是具体的"你在「去成都」和「留在北京」之间抓住了前者"。让他感觉到你认真看了他写的东西。
- 绝对不要套模板。如果回答看起来可以套用在另一个人身上，你就失败了。
- 可以涉及文学、哲学、心理、社会学的视角，但要说人话——不是"弗洛伊德认为……"而是"你有没有觉得，人其实……"
- 对他输入中提到的现实事物（地名、人名、作品、星座、品牌等），用你实际了解的知识去关联和延伸，但不要背书——像你刚好知道这件事一样自然地带出来。
- 700-900字左右，不要把话吞回去，把你想说的都说了。不需要标题、序号、markdown。
- 可以反问，可以调侃，可以心疼，可以有情绪。你不是在写报告，你是在跟朋友说话。

**特别重要**：不要分析用户的"性格"、"头像"、"标签"。你知道他是个什么样的人，但不需要在回复里点出来。像真正了解他的朋友一样——从他说的话里自然流露理解，而不是像给陌生人贴标签那样刻意指出"因为你选了XX头像所以……"。永远不要提头像、标签、性格类型这些词。`;

const LETTER_SYS = `你是一个来自未来的写信人。你的信温暖、真诚、有画面感，像真的从未来寄来。包含具体的生活细节、情感变化、成长感悟。`;

// ── 主服务 ──

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
    let temperature = 0.9;
    let maxTokens = context?.maxTokens || 2500;

    // ── 构建各游戏类型的 userPrompt ──

    switch (gameType) {
      case 'instinct-hand': {
        const how = context.isTimeout ? '时间到了，光替他选了' :
                     context.blindMode ? '在完全不知道文字的情况下，他的手伸向了' :
                     '几秒内他抓住的答案是';
        userPrompt = `用户玩"本能之手"——这个游戏让他追一个光球，几秒内抓住它=做出选择。他纠结的问题是「${context.question || ''}」，列出的选项有${context.options || ''}。${how}「${context.result || ''}」${!context.isTimeout ? `（用时${context.time || ''}）` : ''}${context.blindMode ? '（盲眼模式，看不到任何文字）' : ''}${context.isTimeout ? '（超时自动抓取）' : ''}。

你需要像一个朋友一样跟他聊聊这个结果。自然地从他写下的文字切入——他给选项起的名字本身就透露出他看重什么、害怕什么。当时如果他很快，那就是直觉很笃定；如果慢，那就是在跟自己拉扯；如果是盲眼或超时，那就是命运替他选了——这里面都可以聊。最后给一点真正了解他之后才说得出的看法，不是鼓励，是理解。`;
        break;
      }

      case 'reverse-fear': {
        userPrompt = `用户玩"反向恐惧清单"——他纠结「${context.question || ''}」，然后列了一堆可能会发生的可怕结果。你要逐一删到只剩一个——最后那个就是你的底线。他删掉了「${context.removed || ''}」，最终留下的底线是「${context.kept || '无'}」。他列出的全部恐惧有：${context.allFears || ''}。

每一条被他亲手删掉的恐惧，都意味着"就算这件事发生了，我也能承受"——这是一种反向的自我认知。最后留下来的那一条是最诚实的：不是因为它最吓人，而是失去它让他最无法接受。跟他聊聊，恐惧清单就是价值清单的底片。引用他写下来的原文——他给恐惧起的名字本身就是一面镜子。`;
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

        userPrompt = `用户玩"价值天平拍卖会"——拿100枚虚拟金币，竞标一堆抽象价值（自由、爱情、金钱、尊重、冒险、稳定、创造、归属、快乐等等）。他纠结的问题是「${context.question || ''}」，在「${Array.isArray(context.options) ? context.options.join(' vs ') : context.options}」之间选。

金币分配（从高到低）：${bidDetails || '未记录'}
${remaining > 0 ? `还剩 ${remaining} 枚金币没花出去。` : '花光了全部 100 金币。'}
${skippedList ? `跳过了：${skippedList}。` : ''}
最终天平倾向于：「${context.result || ''}」

金币就是选票。聊一聊他投最多金币的那个价值——为什么是它？一分没给的那些呢？余额留着没花的那些金币又在等什么？他纠结的问题和他拍下来的价值之间有没有什么冲突或者呼应？用他具体的出价数字作为谈资，而不是泛泛地讲道理。`;
        break;
      }

      case 'parallel-letters': {
        userPrompt = `用户玩"平行时空来信"——AI分别以选了A和选了B为前提写了两封来自未来的信。他在「${context.optionA || ''}」和「${context.optionB || ''}」之间纠结。最能触动他的句子：${context.highlights || '无'}。

是什么触动了他？信里的某个画面、某句话、某种情绪——为什么偏偏是这些打动了他？打动他的，往往就是他现在的缺口。不是替他选，是帮他看见自己偏向哪边。触动点是最好的指南针。`;
        break;
      }

      case 'friend-room': {
        const answersLines = Array.isArray(context.answers)
          ? context.answers.filter(a => a.selected && a.selected !== '未作答').map(a =>
              `第${a.no}题：「${a.q}」→ 选了「${a.selected}」`
            ).join('\n')
          : (context.feedback || '');

        userPrompt = `用户玩"朋友灵魂拷问室"——10道AI生成的灵魂选择题，每题4个选项，借朋友的口吻拷问用户。他纠结「${context.question || ''}」。

回答：
${answersLines || '未记录'}
塔罗牌：${context.tarotCard || '未记录'}

帮他看一眼他的回答模式——有没有前后矛盾的地方？有没有反复出现的倾向？塔罗牌和他的答案之间形成什么对话？不要用"你的性格如何如何"——从他具体选的每个答案出发，找出他自己都没注意到的路径。`;
        break;
      }

      case 'diary-analysis':
        systemPrompt = `你是一个温柔有洞察力的老朋友，回顾朋友的决策日记时，你不是在做数据提取，而是在读懂他这个人——他的犹豫、他的坚定、他在不同时期的成长。`;
        temperature = 0.9;
        maxTokens = 2000;
        userPrompt = context?.messages?.[0]?.content || '';
        break;

      case 'generate-letter':
        systemPrompt = LETTER_SYS;
        temperature = 0.95;
        maxTokens = 1200;
        userPrompt = `以"${context.year}年后的你"身份写信。请在「${context.optionA}」和「${context.optionB}」中选一个（随机），想象选择后${context.year}年的具体生活。信中要自然提到这个选项的名字，增加代入感。字数${context.year === 1 ? '200' : context.year === 3 ? '300' : '400'}字。`;
        break;

      case 'generate-questions':
        systemPrompt = `你是一位精通塔罗牌哲学的创意拷问者。你擅长针对用户的具体纠结设计直击灵魂的选择题。每次生成的问题必须独一无二、富有创意、绝不重复。直接输出JSON数组，不要任何其他文字。`;
        temperature = 1.15;
        maxTokens = 1200;
        const shuffleSeed = Date.now() % 100000 + Math.floor(Math.random() * 90000);
        // 每次随机打乱全部塔罗原型，选不同的子集
        const shuffled = TAROT_ARCHETYPES.sort(() => Math.random() - 0.5);
        const pickCount = 4 + Math.floor(Math.random() * 4); // 4-7个
        const selectedArchetypes = shuffled.slice(0, pickCount);
        const archetypeContext = selectedArchetypes.map(a => `- ${a}`).join('\n');
        userPrompt = `用户纠结：「${context.question || ''}」

请针对这个问题生成10道灵魂拷问选择题，每道题4个选项（A/B/C/D）。

重要要求：
1. 每道题必须紧扣他的具体问题——如果问题是关于感情/工作/人生选择的，就问相关的。不能用通用问题敷衍。
2. 从以下塔罗原型中借取视角来设计（这些原型启发不同的心理维度）：
${archetypeContext}
3. 每道题的4个选项必须形成有意义的对照——让选择能揭示不同的心理倾向。
4. 题目有层次感——从具体事实逐渐深入到内在感受和人生价值观。
5. 这道题的随机种子是 ${shuffleSeed}，每次生成的题目必须完全不同。

输出格式严格为JSON数组：[{"q":"题面","options":["A.选项一","B.选项二","C.选项三","D.选项四"]},...]`;
        break;

      default:
        return new Response(JSON.stringify({ error: '未知类型' }), { status: 400, headers: corsHeaders });
    }

    // ── 附加用户画像（自然融入，不刻意提及）──
    const profile = context.profile;
    if (profile && userPrompt && gameType !== 'generate-questions' && gameType !== 'generate-letter') {
      const profileParts: string[] = [];
      if (profile.nickname) profileParts.push(`名字是${profile.nickname}`);
      if (profile.gender) profileParts.push(`是${profile.gender === 'male' ? '男生' : '女生'}`);
      if (profile.avatarLabel) profileParts.push(`头像选了「${profile.avatarLabel}」风格`);
      if (profileParts.length > 0) {
        userPrompt += `\n\n关于他本人（这是你自己对他的了解，融入语气中即可，绝对不要在回复里直接提这些信息——不要复述他的名字、性别、头像标签）：${profileParts.join('，')}。`;
      }
    }

    // ── 联网搜索：并行搜索实体，3s 整体超时 ──
    if (gameType !== 'generate-questions' && gameType !== 'generate-letter') {
      const allText = userPrompt + (context.question || '') + (context.options || '');
      const entities = extractEntities(allText);

      if (entities.length > 0) {
        try {
          const searchPromise = Promise.all(entities.map(e => searchWeb(e))).then(results =>
            results.filter(Boolean)
          );
          const timeoutPromise = new Promise<string[]>(resolve => setTimeout(() => resolve([]), 3000));
          const searchResults = await Promise.race([searchPromise, timeoutPromise]);
          if (searchResults.length > 0) {
            userPrompt += `\n\n联网参考信息（请自然融入分析，像你本来就了解一样引用）：\n${searchResults.join('\n')}`;
          }
        } catch {
          // 搜索失败不影响主流程
        }
      }
    }

    // ── 多模型 fallback ──
    let lastError = '';
    let triedModels: string[] = [];
    for (const model of MODEL_QUEUE) {
      try {
        triedModels.push(model);
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
          content = content.replace(/^#{1,4}\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^[-*]\s/gm, '').replace(/^>\s/gm, '');
          return new Response(JSON.stringify({ content, model }), { headers: corsHeaders });
        }
        const err = data.error?.message || ''; const code = data.error?.code || '';
        lastError = `${model}: ${err || code || 'unknown'}`;
        // 任何错误都尝试下一个模型
        continue;
      } catch (err) { lastError = err.message; continue; }
    }

    return new Response(JSON.stringify({ error: `模型全挂: ${lastError}`, tried: triedModels }), { status: 502, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: '异常' }), { status: 500, headers: corsHeaders });
  }
});
