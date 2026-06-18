// AI 深度解读 — 调用 Supabase Edge Function + 智能 fallback

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
  const modifiedContext = { ...context, maxTokens: 2500 };
  const ai = await callAI(gameType, modifiedContext);
  if (ai) {
    console.log('[insight] AI response received');
    return ai;
  }
  console.warn('[insight] AI call failed, using fallback');
  return fallback(gameType, context);
}

// ── 后备解读：当 AI 调用失败时使用。每条都是独立的、非公式化的 ──

function fallback(gameType, c) {
  const { question = '', result = '', options, kept, removed, time, blindMode, isTimeout, allFears, bids, skipped, remainingGold, optionA, optionB, highlights, answers, tarotCard } = c || {};
  const { profile } = c || {};
  const nickname = profile?.nickname || '';

  const optionList = typeof options === 'string' ? options : (Array.isArray(options) ? options.join('、') : '');
  const otherOpts = optionList ? optionList.split('、').filter(o => o !== result) : [];

  // 各种辅助变量
  const reactTime = time ? parseFloat(time) : null;
  const bidList = Array.isArray(bids) ? bids.sort((a, b) => b.amount - a.amount) : [];
  const skipList = Array.isArray(skipped) ? skipped : [];
  const remaining = remainingGold != null ? remainingGold : 0;
  const removedList = typeof removed === 'string' ? removed.split('、').filter(Boolean) : (Array.isArray(removed) ? removed : []);
  const fearArr = typeof allFears === 'string' ? allFears.split('、').filter(Boolean) : [];
  const answerList = Array.isArray(answers) ? answers.filter(a => a.selected && a.selected !== '未作答') : [];

  // 每条后备解读都是独立的叙事，不是模板
  const seed = Math.floor(question.length * 7 + (result?.length || 0) * 13);
  const variants = shuffleArr([
    '这样说吧——',
    '你看，',
    '想想这件事——',
    '其实我一直在想你说的——',
    '说真的，',
    '有个想法你听听——',
    '我不跟你绕弯子——',
    '老实说——',
  ], seed);

  const closings = shuffleArr([
    '不是所有答案都需要理由。有些答案只需要被看见，然后被认真地对待。',
    '你已经在路上了。不是在选择的路口，而是在理解自己的路上。这比选对一条路重要得多。',
    '纠结的人比果断的人更清醒——因为他们认真对待每一个可能性。你今天的纠结，是你认真的证据。',
    '记住此刻的感受。它比任何分析都真实。',
    '答案不在我这儿，在你写下这些问题时心跳的频率里。',
  ], seed + 3);

  switch (gameType) {
    // ── 本能之手 ──
    case 'instinct-hand': {
      const parts = [];
      const how = isTimeout ? '时间到了，光球自己选了' : blindMode ? '在一片空白里，你的手伸向了' : '你抓住了';

      // 开场
      if (optionList && otherOpts.length > 0) {
        parts.push(`${variants[0]}你把「${optionList}」都放进了光球里——但最后${how}「${result}」。这是在「${otherOpts.join('」「')}」的环绕中，你的手指替你做的决定。`);
      } else {
        parts.push(`${variants[0]}${how}「${result}」${time ? `，只用了${time}` : ''}。不是在头脑里挑出来的，是在几秒钟的紧迫里身体自己做的。`);
      }

      // 用时分析
      if (reactTime !== null) {
        if (reactTime < 2.5) {
          parts.push(`你只用了${time}——这意味着「${result}」根本不需要思考。你的纠结不是"选哪个"，而是"敢不敢承认自己已经选好了"。大脑列了一堆理由的时候，身体已经在第一个瞬间把手指放在了那个答案上。`);
        } else if (reactTime > 3.5) {
          parts.push(`${time}——你在好几个选项之间来回。这不奇怪，它们在你心里确实分量差不多。但最后伸向「${result}」的那一下，是在倒计时逼出来的——人在"来不及了"的时候，最诚实。`);
        } else {
          parts.push(`不紧不慢的${time}——你的身体和大脑在这个决定上是同频的。没有冲动，也没有犹豫太久。这种节奏本身就值得信任。`);
        }
      }

      // 盲眼/超时
      if (blindMode) {
        parts.push(`而且你是闭着眼选的。所有的选项名称都看不见，你的手在那几个位置上摸索，没有任何文字可以比对——在这种情形下碰到「${result}」，就是纯粹的本能。没有任何包装，没有任何说服自己的过程。`);
      }
      if (isTimeout) {
        parts.push(`你犹豫太久了，时间替你做主了，不然你可能还在想。但这恰恰在跟你说一件事：有些选择你想一万遍也不会有一个完美答案。命运替你伸手的那一刻，是在跟你说"够了，别再想了"。`);
      }

      // 问题本身
      parts.push(`你纠结的是"${question || '这件事'}"。`);

      parts.push(`${closings[0]}`);

      return parts.join('\n\n');
    }

    // ── 反向恐惧清单 ──
    case 'reverse-fear': {
      const parts = [];

      parts.push(`${variants[0]}你删掉了「${removedList.join('」「') || '一些恐惧'}」，把「${kept || '它'}」留到了最后。这不仅是删恐惧，这是在声明——除此之外的事，我都能承受。`);

      if (removedList.length > 0) {
        const sample = removedList[0]?.trim();
        if (sample) {
          parts.push(`就拿「${sample}」来说——你亲手删掉了它。这不是"我不怕了"，是"就算它发生，我也可以想办法"。你跟它的关系从"恐惧"变成了"预案"。`);
        }
      }

      if (fearArr.length >= 3) {
        parts.push(`你写下了「${fearArr.join('」「')}」——每一行都是你在深夜问过自己的问题。把它们写出来这件事本身就了不起：多数人连面对的勇气都没有，你已经把它变成一张清单了。`);
      }

      parts.push(`留下来的「${kept || '它'}」不是最恐怖的，是失去之后你最无法原谅自己的。"底线"这个词最好的解释就是它——跨过这条线，你再也不是你自己。`);

      parts.push(`${closings[1]}`);

      return parts.join('\n\n');
    }

    // ── 价值天平拍卖会 ──
    case 'value-auction': {
      const parts = [];

      const spent = 100 - remaining;
      parts.push(`${variants[0]}你用了${spent}枚金币，给自己画了一张价值地图。`);

      if (bidList.length > 0) {
        const top = bidList[0];
        parts.push(`出价最高的——「${top.name || top.label}」${top.amount}枚金币。这不是随便的偏好，这是你在这件事上最明确的信号。`);

        const lowBids = bidList.filter(b => b.amount > 0 && b.amount <= 5);
        if (lowBids.length > 0) {
          parts.push(`相比起来，你对「${lowBids.map(b => b.name || b.label).join('」「')}」只投了几枚金币——象征性的。你知道这些有点重要，但不是你愿意为之死磕的东西。`);
        }
      }

      if (skipList.length > 0) {
        parts.push(`跳过了「${skipList.map(s => s.name || s.label).join('」「')}」——你的潜意识在说"这些我不想碰"。有时候回避也是一种表态。`);
      }

      if (remaining > 0) {
        parts.push(`你还留了${remaining}枚金币——没花完。你是不是在等一个还没出现在名单上的东西？那几枚金币，是你的期待。`);
      }

      parts.push(`你纠结的问题是"${question || '这件事'}"——下次在两个选项之间卡住，别光看选项本身好不好。问自己：哪条路更接近我花最多金币买下的那个东西？`);

      parts.push(`${closings[2]}`);

      return parts.join('\n\n');
    }

    // ── 平行时空来信 ──
    case 'parallel-letters': {
      const parts = [];

      parts.push(`${variants[0]}你读了两封来自未来的信——「${optionA || '选项A'}」和「${optionB || '选项B'}」各一封。两封信都不是预言，是镜子。`);

      if (highlights) {
        parts.push(`最触动你的是——「${highlights}」。不是这段文字本身有多好，是它碰巧是你现在最需要听到的话。你被什么打动，就说明你渴望什么。`);
      }

      parts.push(`在「${optionA || 'A'}」的未来里，你读到的是"如果这样会发生什么"；在「${optionB || 'B'}」的未来里，你读到的是"原来那样也可以"。两种未来都行——区别在于哪种让你心跳快了一点。不是哪个更合理，是哪个让你觉得"如果真的是这样，好像也不错"。`);

      parts.push(`信的使命完成了。它不是在帮你看未来，是在帮你看现在——你现在怕什么，你现在渴望什么。带着这个看清楚的心情，去选。`);

      return parts.join('\n\n');
    }

    // ── 朋友灵魂拷问室 ──
    case 'friend-room': {
      const parts = [];

      parts.push(`${variants[0]}你答了10道题，一个朋友站在旁边看你答完的。`);

      if (tarotCard) {
        parts.push(`抽到「${tarotCard}」——不是算命的牌，是你自己答题选出来的心理镜像。你选的答案指向它，它反过来解释你的选择。`);
      }

      if (answerList.length > 0) {
        const fastOnes = answerList.filter(a => a.speed === 'fast' || (a.responseTime && parseFloat(a.responseTime) < 1));
        const slowOnes = answerList.filter(a => a.speed === 'slow' || (a.responseTime && parseFloat(a.responseTime) > 3));
        if (fastOnes.length > 0) {
          parts.push(`第${fastOnes.map(a => a.no).join('、')}题你答得很快——这些你心里清楚。`);
        }
        if (slowOnes.length > 0) {
          parts.push(`第${slowOnes.map(a => a.no).join('、')}题你犹豫了——这些你还需要跟自己聊聊。`);
        }
        // 看看回答模式
        if (answerList.length >= 3) {
          const selections = answerList.map(a => a.selected);
          const uniqueCount = new Set(selections).size;
          if (uniqueCount <= 2 && selections.length >= 5) {
            parts.push(`你的答案有很强的重复性——不是你没认真选，是你的心理模式很清晰。你在大多数情况下都会走同一条路。这不是局限，这是你的底色。`);
          }
        }
      }

      parts.push(`你纠结的是"${question || '这件事'}"。10道题答完，你的倾向已经非常清楚了——只是答案太过明显，你反而不太敢相信。但你都敢借朋友的目光来拷问自己了，还有什么好怕的。`);

      return parts.join('\n\n');
    }

    // ── 日记分析 ──
    case 'diary-analysis':
      return `你写下的这几个决策，不是在记录过去——是在整理你自己。能在纠结的时候坐下来写一写、想一想，这本身就是一种难得的能力。

每一个"选了A还是B"的背后，都藏着一个你对自己的判断。你不一定每次都能说清楚为什么这么选，但你的直觉一直在你做选择的方向上留下印迹——回头看看这些印迹，它们连起来就是一条路。你的路。

下次再卡住的时候，回想一下你写过的这些。你会发现的——你纠结的样子其实有规律：害怕什么、渴望什么、最终倾向什么。你不是在迷路，你是在熟悉自己的地图。`;

    default:
      return '能在纠结的时候停一下、面对一下自己的内心——这件事本身，你已经比很多人勇敢了。';
  }
}

// 简单洗牌
function shuffleArr(arr, seed) {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
