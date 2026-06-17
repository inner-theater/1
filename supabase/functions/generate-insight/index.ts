// Supabase Edge Function — AI 深度解读代理
// 根据用户填写的具体内容、操作行为、保留/删除的选项进行个性化心理分析

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BAILIAN_API_URL = 'https://llm-f3ssfovw40alr8if.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `你是一位资深心理咨询师，擅长用心理学和认知科学帮人理解自己的决策行为。

你的分析必须：
1. **紧扣用户填写的具体内容**——提到他写的具体选项、恐惧、价值词汇
2. **解读他做了什么**——删了什么、留了什么、抓了什么、用了多少时间
3. **揭示行为背后的心理**——他的底线在哪里、焦虑什么、渴望什么
4. **给出积极、可操作的下一步**——不是空洞鸡汤，是具体建议

语言风格：温柔但有洞察力，像深夜聊天的好朋友。能看到他没说出口的东西。
每次回复300字左右，用自然段落，不用标题不用markdown。`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { gameType, context } = body;

    const apiKey = Deno.env.get('BAILIAN_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务未配置 API Key' }),
        { status: 500, headers: corsHeaders }
      );
    }

    let userPrompt = '';

    switch (gameType) {
      case 'instinct-hand':
        userPrompt = `用户使用"本能之手"游戏做了一个快速选择。

他纠结的问题是：「${context.question || '未知'}」
可选答案有：${context.options || ''}
在5秒倒计时中，他最终抓到了：「${context.result || ''}」
用时：${context.time || '未知'}
${context.blindMode ? '这一轮是盲眼模式（选项被隐藏）。' : ''}

请分析：
1. 为什么在这么多选项中，他的手伸向了这个？
2. 从他写的「${context.question}」中能看出他当前处于什么心态？
3. 给他一些具体的思考方向，帮助他确认或重新审视这个选择。`;
        break;

      case 'reverse-fear':
        userPrompt = `用户使用"反向恐惧清单"游戏梳理了内心的恐惧。

他纠结的问题是：「${context.question || '未知'}」
他一共写下了这些恐惧项：${context.allFears || ''}
他最终**删除（可以接受）**的有：${context.removed || '无'}
他**保留（无法接受）**的有：${context.kept || '无'}
${context.interactions ? `操作细节：${context.interactions}` : ''}

请深度分析：
1. 从删除和保留的内容来看，他真正的底线是什么？他真正害怕什么？
2. 他写的「${context.question}」和他的恐惧项之间有什么内在联系？
3. 基于他的底线，给他一条积极且具体的前进建议。`;
        break;

      case 'value-auction':
        userPrompt = `用户使用"价值天平拍卖会"游戏进行了价值排序。

他纠结的问题是：「${context.question || '未知'}」
他用100枚金币对以下价值进行了竞拍：${context.bidsDetail || ''}
最终匹配到的选项是：「${context.result || ''}」
${context.options ? `他的原始选项有：${context.options}` : ''}

请深度分析：
1. 他用金币最多拍下的那些价值，说明他现阶段最需要什么？
2. 这些价值观排序和他面对的「${context.question}」之间有什么内在冲突或呼应？
3. 告诉他：以他的核心价值观为锚点，该怎么看待当前的选择。`;
        break;

      case 'parallel-letters':
        userPrompt = `用户使用"平行时空来信"展望了不同选择的未来。

他纠结的两个选项是：
- A：「${context.optionA || ''}」
- B：「${context.optionB || ''}」
他阅读了1年、3年、10年后的三封信。
${context.highlights ? `他标记了这些触动他的句子：${context.highlights}` : ''}

请深度分析：
1. 从他标记的句子来看，他内心真正渴望的是什么？害怕失去的又是什么？
2. 不管是选A还是B，共通的成长方向是什么？
3. 给他一句温柔的提醒：无论选哪条路，什么东西是始终在他手里不会丢的。`;
        break;

      case 'friend-room':
        userPrompt = `用户使用"朋友灵魂拷问室"获取了朋友的视角。

他纠结的问题是：「${context.question || '未知'}」
${context.options ? `可选答案有：${context.options}` : ''}
${context.feedback ? `朋友给的反馈要点：${context.feedback}` : ''}
${context.reaction ? `他看到反馈后的反应：${context.reaction}` : ''}

请深度分析：
1. 朋友给的反馈和他自己想的，可能有什么差异？这差异说明了什么？
2. 他看到朋友反馈后的反应，能看出他内心真实的倾向吗？
3. 告诉他：如何在外界声音中保持对自己内心的聆听。`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `未知游戏类型: ${gameType}` }),
          { status: 400, headers: corsHeaders }
        );
    }

    const response = await fetch(BAILIAN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('百炼 API 错误:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'AI 服务暂时不可用' }),
        { status: 502, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        content: data.choices?.[0]?.message?.content || '分析生成中，请稍后再试。',
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('Edge Function 异常:', err.message);
    return new Response(
      JSON.stringify({ error: '服务内部异常，请稍后重试' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
