// Supabase Edge Function — AI 统一代理
// 联网搜索 + 多模型 fallback（qwen-turbo 优先）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BAILIAN_API_URL = 'https://llm-f3ssfovw40alr8if.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions';

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

function extractEntities(text: string): string[] {
  const entities: string[] = [];
  const placePatterns = [
    /(?:在|去|到|从|住|移居|搬到|生活在)([\u4e00-\u9fff]{2,6}(?:市|省|县|区|镇|村|街道|路|街|广场|花园|大厦|中心))/g,
    /(?:北京|上海|广州|深圳|杭州|成都|武汉|南京|重庆|西安|长沙|苏州|天津|厦门|青岛|大连|昆明|哈尔滨|长春|沈阳|郑州|济南|合肥|福州|南昌|贵阳|南宁|海口|拉萨|银川|西宁|兰州|乌鲁木齐|香港|澳门)/g,
  ];
  const personPatterns = [
    /(?:像|和|参考|学)([\u4e00-\u9fff]{2,4})(?:一样|那样|的方式|的模式)/g,
    /(?:苏格拉底|柏拉图|亚里士多德|孔子|老子|庄子|孟子|尼采|叔本华|荣格|弗洛伊德|萨特|加缪|卡夫卡|村上春树|东野圭吾|贾平凹|莫言|余华|王小波|三毛|张爱玲|鲁迅)/g,
  ];
  const zodiacPatterns = /(?:白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座)/g;
  const workPatterns = /《([\u4e00-\u9fff]{1,20})》/g;
  const brandPatterns = /(?:阿里|腾讯|百度|字节|华为|小米|比亚迪|特斯拉|苹果|谷歌|微软|亚马逊|Meta|OpenAI|蔚来|理想|小鹏|京东|美团|滴滴|拼多多|哔哩哔哩)/g;
  const foodPatterns = /(?:火锅|烧烤|日料|西餐|中餐|川菜|粤菜|湘菜|淮扬菜|海鲜|素食|轻食|奶茶|咖啡|烘焙|甜品)/g;
  const healthPatterns = /(?:焦虑|抑郁|失眠|头痛|胃病|过敏|高血压|糖尿病|颈椎|腰椎|近视|牙痛|感冒|发烧|咳嗽)/g;
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
  return entities.slice(0, 3);
}

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
    return snippets.length > 0 ? `${query}: ${snippets.join(' ')}` : '';
  } catch {
    return '';
  }
}

// ── 系统提示词 ──
const SYS = `你是用户的老朋友。不是客客气气的那种朋友，是认识很久、知道他软肋、见过他狼狈也见过他发光的那种。

你不需要做"心理分析"。你只需要像深夜聊天——听他说完，然后聊聊。可以深沉，可以抒情，可以逗他，可以突然安静。但一定要真诚、有温度，要让他觉得"这个人真的懂我"。

核心纪律：
1. 套公式就是背叛。每一段回复都必须独一无二——如果这段话换个人也能用，你失败了。
2. 他写下的每个字都是你的谈资——选项名、恐惧清单、金币数、触动他的句子——逐字引用、展开、深挖。不是"你在纠结……"，而是"你写下'去成都'的时候，这三个字里藏着什么你自己都没敢承认的东西"。
3. 如果他的输入涉及现实事物——地名、名人、星座、书影音、食物、疾病、品牌公司、职业等——像你真的了解这些事物一样去聊。我可能在后面附上联网搜索结果，参考它们但不要硬贴——像你刚好知道一样随口提起。
4. 永远不在回复里提"头像""标签""性格类型"。你知道他是怎样的人，但不贴标签。
5. 要有情绪——感叹、自嘲、停顿、反问。你是活人。
6. 800-1000字。写少了就是敷衍。不需要标题、序号或markdown格式。`;

const LETTER_SYS = `你不是"写信人"——你就是一个走过这段路的普通人。某个下午突然想起当年那个纠结，拿起手机发了条长消息。不要"亲爱的你"，不要写信格式，不要总结道理。用聊天口吻说具体的事：在哪个城市、做什么、最近在为什么开心/头疼。可以自嘲，可以不太确定。让读的人觉得这是真人。`;

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
    let maxTokens = 2500;

    switch (gameType) {
      case 'instinct-hand': {
        const how = context.isTimeout ? '时间到了，光替他选了' :
                     context.blindMode ? '在完全不知道文字的情况下，他的手伸向了' :
                     '几秒内他抓住的答案是';
        userPrompt = `用户玩"本能之手"——追一个光球，几秒内抓住它=做出选择。他的问题是「${context.question || ''}」，选项有${context.options || ''}。${how}「${context.result || ''}」${!context.isTimeout ? `（用时${context.time || ''}）` : ''}${context.blindMode ? '（盲眼模式）' : ''}${context.isTimeout ? '（超时自动抓取）' : ''}。

像老朋友一样跟他聊聊这个结果。引用他写下的选项名——每个选项的名字都透露了他看重什么。聊聊快慢的意义、盲眼和超时的隐喻。写出深度和温度，800-1000字。`;
        break;
      }
      case 'reverse-fear': {
        userPrompt = `用户玩"反向恐惧清单"——他纠结「${context.question || ''}」，列出所有可能发生的可怕结果，然后逐一删掉，只剩一个底线。他删掉了「${context.removed || ''}」，最终留下的底线是「${context.kept || '无'}」。全部恐惧：${context.allFears || ''}。

这是一个很有深度的游戏——删除="这件事我能承受"，留下=失去它我就不是我了。一条条引用他亲手写的恐惧名字，挖掘每一条背后的心理。恐惧清单是价值清单的底片——只要翻转一下，就能看见他真正在意什么。写得深情一点，800-1000字。`;
        break;
      }
      case 'value-auction': {
        const bidDetails = Array.isArray(context.bids) && context.bids.length > 0
          ? context.bids.sort((a, b) => b.amount - a.amount).map(b => `${b.icon}${b.name}：${b.amount}金币`).join('，')
          : (context.bidsDetail || '');
        const skippedList = Array.isArray(context.skipped) && context.skipped.length > 0
          ? context.skipped.map(s => `${s.icon}${s.name}`).join('、') : '';
        const remaining = context.remainingGold != null ? context.remainingGold : 0;
        userPrompt = `用户玩"价值天平拍卖会"——100枚虚拟金币竞拍抽象价值（自由、爱情、金钱、尊重、冒险、稳定、创造、归属、快乐等）。他纠结「${context.question || ''}」，在「${Array.isArray(context.options) ? context.options.join(' vs ') : context.options}」之间选。金币分配：${bidDetails || '未记录'}。${remaining > 0 ? `还剩${remaining}枚金币。` : '花光全部100金币。'}${skippedList ? `跳过了：${skippedList}。` : ''}天平倾向于：「${context.result || ''}」。引用具体出价数字，分析出价最高的价值和他纠结的问题之间的呼应。800-1000字。`;
        break;
      }
      case 'parallel-letters': {
        userPrompt = `用户玩"平行时空来信"——读了两封未来的信，在「${context.optionA || ''}」和「${context.optionB || ''}」之间纠结。最能触动他的句子：${context.highlights || '无'}。打动他的那个瞬间，就是他内心缺口的位置。引用原文中触动他的句子，展开分析——为什么偏偏是这几句？读出他没说出口的渴望和恐惧。深情、有文学感、800-1000字。`;
        break;
      }
      case 'friend-room': {
        const answersLines = Array.isArray(context.answers)
          ? context.answers.filter(a => a.selected && a.selected !== '未作答').map(a => `第${a.no}题：「${a.q}」→「${a.selected}」`).join('\n')
          : (context.feedback || '');
        userPrompt = `用户玩"朋友灵魂拷问室"——10道AI生成的灵魂选择题，每题4个选项，借朋友的口吻拷问用户。他纠结「${context.question || ''}」。他的回答：${answersLines || '未记录'}。抽到塔罗牌：${context.tarotCard || '未记录'}。

请像老朋友坐下来帮他复盘，写800-1000字的深度分析：
1. 引用3-5道具体题目原文和他的选择——找他的答题模式：哪些是秒选的（内心笃定）？哪些犹豫了（模糊地带）？前后有没有矛盾（比如前面选稳定，后面选冒险）？
2. 塔罗牌和他的答题倾向形成什么对话？不是为了占卜——是借塔罗的视角帮他看到自己没注意的心理模式。
3. 给出有洞察力的个人化解读——不说"你很纠结"这种废话，而是"你表面怕的是失败，但你的答案告诉我你真正怕的是让某个人失望"这种级别的理解。
4. 最后用一句真正了解他之后才说得出口的话收尾。`;
        break;
      }
      case 'diary-analysis':
        systemPrompt = '你是一个温柔有洞察力的老朋友，回顾朋友的决策日记，读懂他的犹豫、坚定和成长。';
        temperature = 0.9;
        maxTokens = 2000;
        userPrompt = context?.messages?.[0]?.content || '';
        break;
      case 'generate-letter':
        systemPrompt = LETTER_SYS;
        temperature = 0.95;
        maxTokens = 2500;
        const optA = context.optionA || '';
        const optB = context.optionB || '';
        const chosen = Math.random() > 0.5 ? optA : optB;
        const letterProfile = context.profile;
        const nameCall = letterProfile?.nickname ? `（他叫${letterProfile.nickname}）` : '';
        userPrompt = `${context.year}年后的你。他当初在「${optA}」和「${optB}」之间纠结，后来选了「${chosen}」。${nameCall}

想象选了之后的具体生活——不要太笼统，要像真实记忆一样有细节。写出来：
- 你在哪个城市、住在什么样的房子里、窗外的风景
- 做什么工作、每天最享受和最头疼的瞬间
- 有没有养宠物、有没有身边的人
- 当初那个选择带来的最大惊喜和最深的遗憾是什么
- 想到"那个当初纠结的自己"时会有什么感觉

不要讲大道理、不要总结人生意义、不要"亲爱的你"。就是坐下来跟我聊聊。有画面感、有真实的生活气息。${context.year === 1 ? '400' : context.year === 3 ? '600' : '800'}字左右。`;
        break;
      case 'generate-questions':
        systemPrompt = '你是一位精通塔罗牌哲学的创意灵魂拷问者。针对用户的具体纠结，设计深度选择题。你必须做到：每次生成的题目完全不同，视角多变，不重复不套路。直接输出JSON数组。';
        temperature = 1.2;
        maxTokens = 1500;
        const shuffleSeed = Date.now() % 100000 + Math.floor(Math.random() * 90000);
        const shuffled = TAROT_ARCHETYPES.sort(() => Math.random() - 0.5);
        const pickCount = 5 + Math.floor(Math.random() * 4);
        const selectedArchetypes = shuffled.slice(0, pickCount);
        const archetypeContext = selectedArchetypes.map(a => `- ${a}`).join('\n');
        userPrompt = `用户纠结：「${context.question || ''}」

生成10道灵魂拷问选择题，每道4个选项（A/B/C/D）。核心要求：
1. 紧密结合他的具体问题——如果他是问换工作，就问职业、勇气、安全感、自我价值相关的；如果是感情问题，就问亲密关系、信任、取舍相关的。绝对不能用"你最近开心吗"这种通用题敷衍。
2. 每一道题的8道以上要让他"犹豫一下"——不是好和坏的对比，而是两种真实可能性的对峙。
3. 从以下塔罗原型借视角和深度（随机使用其中一部分）：
${archetypeContext}
4. 题目有递进层次——前3道接近表面现实，中间4道深入内心，最后3道触及人生价值和终极恐惧。
5. 随机种子为${shuffleSeed}——每次必须产出完全不同的题目集。

输出严格JSON数组：[{"q":"直面灵魂的题面","options":["A.有深度的选项","B.有深度的选项","C.有深度的选项","D.有深度的选项"]},...]`;
        break;
      case 'personality-test':
        systemPrompt = '你是一个温和而有洞察力的人格分析师。你了解大五人格模型(OCEAN)，能做深入但不说教的解读。像朋友聊天一样分析，不要套公式，不要贴标签。800字左右。';
        temperature = 0.9;
        maxTokens = 2500;
        const ptscores = context.scores || {};
        const slines = Object.entries(ptscores).map(([dim, score]) => {
          const label = { openness:'开放性', conscientiousness:'尽责性', extraversion:'外向性', agreeableness:'宜人性', neuroticism:'情绪稳定性' }[dim] || dim;
          const emoji = { openness:'🎨', conscientiousness:'📋', extraversion:'🎤', agreeableness:'🤝', neuroticism:'🧘' }[dim] || '';
          return `${emoji} ${label}：${score}/10`;
        }).join('\n');
        userPrompt = `用户做了大五人格测试（OCEAN模型），得分如下：\n${slines}\n\n请像老朋友一样解读这份人格画像。说人话，有情绪，有温度。引用得分数字但不要念数据。可以联系文学、电影、生活中的例子。写出深度。800字左右。`;
        break;

      default:
        return new Response(JSON.stringify({ error: '未知类型' }), { status: 400, headers: corsHeaders });
    }

    // 用户画像（不刻意提及）
    const profile = context.profile;
    if (profile && userPrompt && gameType !== 'generate-questions' && gameType !== 'generate-letter') {
      const parts: string[] = [];
      if (profile.nickname) parts.push(`名字是${profile.nickname}`);
      if (profile.gender) parts.push(`是${profile.gender === 'male' ? '男生' : '女生'}`);
      if (profile.avatarLabel) parts.push(`头像选了「${profile.avatarLabel}」风格`);
      if (parts.length > 0) {
        userPrompt += `\n\n关于他本人（这是你自己的了解，融入语气即可，绝对不要在回复里直接提）：${parts.join('，')}。`;
      }
    }

    // 联网搜索
    if (gameType !== 'generate-questions' && gameType !== 'generate-letter') {
      const allText = userPrompt + (context.question || '') + (context.options || '');
      const entities = extractEntities(allText);
      if (entities.length > 0) {
        try {
          const searchPromise = Promise.all(entities.map(e => searchWeb(e))).then(r => r.filter(Boolean));
          const timeoutPromise = new Promise<string[]>(resolve => setTimeout(() => resolve([]), 3000));
          const results = await Promise.race([searchPromise, timeoutPromise]);
          if (results.length > 0) {
            userPrompt += `\n\n联网参考（自然引用，不要硬贴）：\n${results.join('\n')}`;
          }
        } catch { /* ignore */ }
      }
    }

    // 多模型 fallback
    let lastError = '';
    const triedModels: string[] = [];
    for (const model of MODEL_QUEUE) {
      try {
        triedModels.push(model);
        const resp = await fetch(BAILIAN_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature, max_tokens: maxTokens }),
        });
        const data = await resp.json();
        if (resp.ok && data.choices?.[0]?.message?.content) {
          let content = data.choices[0].message.content;
          content = content.replace(/^#{1,4}\s+/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^[-*]\s/gm, '').replace(/^>\s/gm, '');
          return new Response(JSON.stringify({ content, model }), { headers: corsHeaders });
        }
        lastError = `${model}: ${data.error?.message || data.error?.code || 'unknown'}`;
      } catch (err) { lastError = err.message; }
    }

    return new Response(JSON.stringify({ error: `全挂: ${lastError}`, tried: triedModels }), { status: 502, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: '异常' }), { status: 500, headers: corsHeaders });
  }
});
