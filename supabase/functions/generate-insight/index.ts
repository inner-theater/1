// Supabase Edge Function — AI 统一代理
// 多模型自动 fallback，额度用完自动切换下一个

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BAILIAN_API_URL = 'https://llm-f3ssfovw40alr8if.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions';

// 模型优先级队列：第一个失败换下一个
const MODEL_QUEUE = ['qwen-turbo', 'qwen-plus', 'deepseek-v3', 'qwen-max'];

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `你是一位资深心理咨询师，擅长用心理学和认知科学帮人理解自己的决策行为。
你的分析必须紧扣用户填写的具体内容，解读行为背后的心理，给出积极可操作的建议。
语言风格：温柔但有洞察力，像深夜聊天的好朋友。`;

const LETTER_SYSTEM = `你是一个来自未来的写信人，温暖、真诚、有画面感。
信要像真的从未来寄来一样自然——包含具体的生活细节、情感变化、成长感悟。
风格像《解忧杂货店》那样温暖治愈。`;

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
    let systemPrompt = SYSTEM_PROMPT;
    let temperature = 0.8;
    let maxTokens = context?.maxTokens || 600;

    switch (gameType) {
      case 'instinct-hand':
        userPrompt = `用户使用"本能之手"游戏做了一个快速选择。
他纠结的问题：「${context.question || '未知'}」
可选答案：${context.options || ''}
在5秒倒计时中抓到了：「${context.result || ''}」（用时${context.time || ''}）${context.blindMode ? '，是盲眼模式' : ''}
请分析为什么他的手伸向了这个答案，他当前是什么心态，并给出具体的思考方向。`;
        break;

      case 'reverse-fear':
        userPrompt = `用户使用"反向恐惧清单"梳理了内心的恐惧。
问题：「${context.question || '未知'}」
恐惧项：${context.allFears || ''}
删除的：${context.removed || '无'}
保留的（底线）：${context.kept || '无'}
${context.interactions || ''}
请分析他真正的底线和恐惧是什么，并给出一条积极前进建议。`;
        break;

      case 'value-auction':
        userPrompt = `用户使用"价值天平拍卖会"进行了价值排序。
问题：「${context.question || '未知'}」
选项：${context.options || ''}
金币分配：${context.bidsDetail || ''}
匹配结果：「${context.result || ''}」
请分析他的价值观排序意味着什么，以核心价值为锚点该如何选择。`;
        break;

      case 'parallel-letters':
        userPrompt = `用户使用"平行时空来信"展望了不同选择的未来。
选项A：「${context.optionA || ''}」选项B：「${context.optionB || ''}」
${context.highlights ? `触动他的句子：${context.highlights}` : ''}
请分析他内心真正渴望和害怕失去的是什么，温柔的鼓励他。`;
        break;

      case 'friend-room':
        userPrompt = `用户通过"朋友灵魂拷问室"获取了朋友视角。
问题：「${context.question || '未知'}」${context.options ? `选项：${context.options}` : ''}
请从外部反馈角度分析，并提醒保持自我聆听。`;
        break;

      case 'diary-analysis':
        systemPrompt = `你是一位资深的心理分析师，擅长从行为数据中读取人物画像。`;
        temperature = 0.9;
        maxTokens = 800;
        userPrompt = context?.messages?.[0]?.content || '';
        break;

      case 'generate-letter':
        // 平行时空来信 —— AI 写信
        systemPrompt = LETTER_SYSTEM;
        temperature = 0.95;
        maxTokens = 800;
        userPrompt = `请以"${context.year}年后的你"的身份，给正在纠结的年轻人写一封信。
选项A：${context.optionA}  选项B：${context.optionB}
选择其中一个（随机），想象选择后${context.year}年的生活，写一封温暖真诚的信。
字数${context.year === 1 ? '200' : context.year === 3 ? '300' : '400'}字左右。`;
        break;

      default:
        return new Response(JSON.stringify({ error: '未知类型' }), { status: 400, headers: corsHeaders });
    }

    // 多模型 fallback
    let lastError = '';
    for (const model of MODEL_QUEUE) {
      try {
        const response = await fetch(BAILIAN_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
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

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          return new Response(JSON.stringify({
            content: data.choices[0].message.content,
            model,
          }), { headers: corsHeaders });
        }

        // Quota exhausted or rate limited
        const errorMsg = data.error?.message || '';
        const errorCode = data.error?.code || '';
        lastError = errorMsg;

        if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorCode === 'rate_limit_exceeded' || errorCode === 'insufficient_quota') {
          console.warn(`模型 ${model} 额度不足，切换到下一个:`, errorMsg);
          continue; // try next model
        }

        // Other errors — don't retry
        console.error(`模型 ${model} 返回错误:`, data);
        break;

      } catch (err) {
        console.error(`模型 ${model} 网络异常:`, err.message);
        lastError = err.message;
        continue;
      }
    }

    // All models failed
    return new Response(JSON.stringify({
      error: `所有模型暂时不可用: ${lastError}`,
    }), { status: 502, headers: corsHeaders });

  } catch (err) {
    console.error('Edge Function 异常:', err.message);
    return new Response(JSON.stringify({ error: '服务异常' }), { status: 500, headers: corsHeaders });
  }
});
