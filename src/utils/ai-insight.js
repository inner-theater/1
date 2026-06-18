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
  const { profile } = c || {};
  const avatarNote = profile?.avatarLabel ? `，以你「${profile.avatarLabel}」的性格` : '';
  const nickname = profile?.nickname || '';

  switch (gameType) {
    case 'instinct-hand': {
      const how = isTimeout ? '时间到了，光替你选了' : blindMode ? '在完全不知道的情况下，你的手伸向了' : '几秒内，你的手指抓住了';
      const lines = [
        `${how}「${result || '它'}」${time ? `，只用了${time}` : ''}。`,
        '',
        `理性还在列清单的时候，本能已经交了卷。${avatarNote}，你天生就不是那种"再想想"的人——你的身体比大脑诚实太多。`,
        '',
        `看到这个结果的第一反应是什么？是松了一口气还是心头一紧？那个瞬间的感受就是答案本身。${nickname ? nickname + '，' : ''}别急着分析利弊，先感受一下你的心。`,
      ];
      return lines.join('\n');
    }
    case 'reverse-fear': {
      const lines = [
        `你删掉了${removed ? `「${removed}」` : '一些恐惧'}，留下了「${kept || '它'}」。`,
        '',
        `删除的那些不是不重要，而是你允许它们发生。留下来的那一个——不是因为它最可怕，而是因为失去它你会最难受。${avatarNote}，你比你以为的更清楚什么才是真正的底线。`,
        '',
        `一个人能承受什么，往往比想要什么更能说明价值观。${nickname ? nickname + '，' : ''}保护好自己的底线，那就是你在这件事上最坚定的方向。别怕，你的底线已经替你做了大部分决定。`,
      ];
      return lines.join('\n');
    }
    case 'value-auction': {
      const lines = [
        `你把金币投给了自己最看重的价值。有意思的是——选项会变，但价值偏好是稳定的。${avatarNote}，你给出的金币分布已经悄悄暴露了你的优先级。`,
        '',
        `下次纠结的时候别光想选项本身，先问自己：这个选择在支持我出价最高的那个价值吗？${nickname ? nickname + '，' : ''}答案往往就在那里。`,
      ];
      return lines.join('\n');
    }
    case 'parallel-letters': {
      const lines = [
        `读了未来的信，最触动你的那些句子其实已经给了答案。${avatarNote}，你在乎的不是「${c?.optionA || 'A'}」或「${c?.optionB || 'B'}」这个标签，而是未来能不能有温度、有故事、有成长。`,
        '',
        `这比选哪个都重要。${nickname ? nickname + '，' : ''}信的使命不是替你做选择，而是让你看清楚——你在怕什么，又渴望什么。`,
      ];
      return lines.join('\n');
    }
    case 'friend-room': {
      const lines = [
        `你答完了10道题${avatarNote}，抽到了一张塔罗牌。这不是预言，是镜像——是你借朋友的视角看见的自己。`,
        '',
        `注意你在答题时的犹豫和果断。那道你秒选的题和那道你纠结了半天的题——它们之间的差距，就是你心里清楚和模糊的边界。${nickname ? nickname + '，' : ''}答案不在水晶球里，在你答每一道题时的本能反应里。`,
      ];
      return lines.join('\n');
    }
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
