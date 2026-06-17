// Supabase Edge Function — AI 解读代理
// 前端请求本函数 → 函数转发到阿里百炼 → 返回结果

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BAILIAN_API_URL = 'https://llm-f3ssfovw40alr8if.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, maxTokens = 400 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: '缺少 messages 参数' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = Deno.env.get('BAILIAN_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务未配置 API Key' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const systemPrompt = `你是一个专业且温柔的心理顾问。你从心理学、行为经济学和认知科学的角度，帮助用户理解他们在「内心剧场」里做出的选择。你的语言风格像朋友在深夜聊天——有理有据，但不说教；有深度，但不晦涩。你始终引导用户看见自己选择的积极面，并给出温和的下一步建议。每次回复控制在200字以内。`;

    const response = await fetch(BAILIAN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
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
