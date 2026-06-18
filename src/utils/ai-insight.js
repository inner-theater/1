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
  const modifiedContext = { ...context, maxTokens: 2500 };
  const ai = await callAI(gameType, modifiedContext);
  if (ai) return ai;
  return fallback(gameType, context);
}

function fallback(gameType, c) {
  const { question, result, options, kept, removed, time, blindMode, isTimeout, allFears, bids, bidsDetail, skipped, remainingGold, optionA, optionB, highlights, answers, tarotCard, feedback } = c || {};
  const { profile } = c || {};
  const nickname = profile?.nickname || '';
  const genderLabel = profile?.gender === 'female' ? '女生' : profile?.gender === 'male' ? '男生' : '';
  const avatarLabel = profile?.avatarLabel || '';
  const avatarPersonalityNote = () => {
    if (!avatarLabel) return '';
    const traits = {
      '冒险': '你喜欢突破和刺激，安稳对你来说反而是一种窒息',
      '稳重': '你追求可靠与确定性，慌张是你最不想面对的状态',
      '温柔': '你敏感细腻，在乎别人的感受胜过在乎规则',
      '自由': '你不喜欢被定义被束缚，任何事情只要有"必须"，你就会本能回避',
      '艺术': '你独特、注重表达，用与众不同的方式看世界',
      '理知': '你用逻辑和知识建立边界，理性是你最可靠的避难所',
      '创造': '你不能接受照搬现状，总想亲手做出些什么不一样的东西',
      '守护': '你把在乎的人放在心上，为了保护他们你可以放弃很多',
      '公正': '你极度在意公平——不是对所有人公平，而是对自己公平',
      '从容': '节奏比别人慢半拍，不是迟钝，是你在思考的同时也照顾感受',
      '率真': '你不屑伪装，诚实面对自己的欲望和情绪是你看重的事',
      '自信': '你相信自己的判断，哪怕所有人都反对你也会先走一步试试',
      '趣味': '你不把人生当作严肃的任务，好玩有意思才是第一驱动',
      '睿智': '你喜欢想清楚再行动，对盲目跟风有天生的警惕',
      '独立': '你习惯于靠自己，不喜欢麻烦别人，但有时也忘了可以示弱',
      '浪漫': '你不信"就该这样"，你相信"也可以是那样"——美的多样的',
    };
    return traits[avatarLabel] || `你选择了「${avatarLabel}」作为自我认知`;
  };

  switch (gameType) {
    case 'instinct-hand': {
      const howLabel = isTimeout ? '时间到了，命运替你选择了' : blindMode ? '在完全不知道选项文字的情况下，你的手伸向了' : '几秒内，你的手指抓住了';
      const optionList = typeof options === 'string' ? options : '';
      const allOptionArr = optionList ? optionList.split('、').filter(Boolean) : [];
      const otherOptions = allOptionArr.filter(o => o !== result).join('、');
      const personality = avatarPersonalityNote();
      const reactTime = time ? parseFloat(time) : null;
      const isFast = reactTime !== null && reactTime < 2.5;
      const isSlow = reactTime !== null && reactTime > 3.5;

      const nameCall = nickname ? `，${nickname}` : '';

      let analysis = `${howLabel}「${result || '它'}」${time ? `，只用了${time}` : ''}。`;

      if (allOptionArr.length >= 2) {
        analysis += ` 你给出的选项是「${allOptionArr.join('」和「')}」——「${result}」在众多选项中脱颖而出，这不是巧合。当理性的天平还在左右摇摆时，你的手指已经替你的心完成了这份抉择。`;
      }

      analysis += `\n\n${personality ? `${personality}${nameCall}。` : ''}`;

      if (isFast) {
        analysis += ` ${time}，几乎是秒选。这说明在你内心深处，「${result}」根本不是和其他选项平起平坐的候选——它是你早就认定了的答案，只是你需要一个"被选出来"的形式来让自己确信。你纠结的不是选哪个，而是敢不敢承认自己已经选好了。`;
      } else if (isSlow) {
        analysis += ` 你在选项之间徘徊了${time}——这说明这几个选项在你心里的分量确实不相上下。但有意思的是，在倒数计时的压力下，你的本能还是伸向了「${result}」。压力的尽头，诚实就出来了。你最真实的自己，往往藏在"没时间再想了"的最后一秒里。`;
      } else {
        analysis += ` 在不快不慢的节奏里，你的本能做出了选择。这个速度本身就很说明问题——你没有冲动，也没有过度犹豫，你的心和大脑在这个瞬间达成了默契。`;
      }

      if (blindMode) {
        analysis += ` 而且你是在完全看不见文字的情况下做出选择的——你没有分析利弊，没有比较优劣，你的手在空白中碰到了「${result}」。这比看得见的抓取更真实：当所有信息都被剥夺的时候，剩下的只有本能。而你的本能选择了「${result}」，这是你没有包装过的、最原始的倾向。`;
      }

      if (isTimeout) {
        analysis += ` 时间到了，你没有来得及做出选择——但命运替你选了「${result}」。这本身就是一个重要的信号：有时候你太想控制一切，反而被"想太多"困住了。命运替你伸手的这个瞬间，也许是提醒你，有些决定不需要想得太完美——你的心早就知道答案，只是你的理智一直在要求更多的证据。`;
      }

      analysis += `\n\n你的纠结是"${question || '这个问题'}"。`;

      if (otherOptions) {
        analysis += ` 你把其他选项——「${otherOptions}」——都放了进去，说明这些也是你真在考虑的路。但本能选了「${result}」，意味着在"都可以"的表象之下，这个选项对你的吸引力有一种别人看不到的力量。你不一定说得出原因，但你的身体替你说了。`;
      }

      analysis += ` 有时候我们以为自己在"纠结"，其实只是不敢对自己诚实。你的手指已经给出了方向，剩下的是你愿不愿意把这个方向走下去。`;

      if (profile?.gender && profile?.avatar) {
        analysis += ` ${genderLabel ? `作为一个${genderLabel}，` : ''}你选择了「${avatarLabel || '这个'}」风格的头像来代表自己——${personality}。这和你在「${result || ''}」上展现出的直觉是一致的：你的自我认知和你的本能选择，在这件事上站在了同一边。这是一种很少见的自洽，说明你对自己有清晰的了解。`;
      }

      analysis += `\n\n别忘了那个瞬间——当你的手指停在「${result || '它'}」上面时，你的第一感受是什么。是"果然如此"的平静，还是"竟然如此"的意外？如果是前者，你其实一直都知道答案；如果是后者，那这个意外就是你今天最重要的发现。不是所有答案都需要理由，有些答案只需要被看见。`;

      return analysis;
    }

    case 'reverse-fear': {
      const personality = avatarPersonalityNote();
      const nameCall = nickname ? `，${nickname}` : '';
      const removedList = typeof removed === 'string' ? removed.split('、').filter(Boolean) : (removed || []);

      let analysis = `你删掉了「${removed || '一些恐惧'}」，留下了「${kept || '它'}」。这不仅仅是一个删除游戏——这是在问你：在所有害怕的事情里，你唯一不能接受的是什么。`;

      if (removedList.length > 0) {
        analysis += `\n\n恭喜你，你亲手允许了这些事情发生——`;
        removedList.forEach((f, i) => {
          analysis += `「${f.trim()}」${i < removedList.length - 1 ? '、' : '。'}`;
        });
        analysis += ` 删掉它们不是因为你不在乎，而是因为你评估过了，这些后果是可以承受的。你比自己想的坚强。而留下的那一个——「${kept || '它'}」——不是因为最可怕，而是因为失去它你会最难受。恐惧的尽头不是害怕，是舍不得。`;
      }

      analysis += `\n\n你在面对"${question || '这个问题'}"时的恐惧清单很有意思。`;

      if (allFears) {
        const fearArr = typeof allFears === 'string' ? allFears.split('、').filter(Boolean) : [];
        if (fearArr.length >= 3) {
          analysis += ` 你写下了「${fearArr.join('」「')}」——这些不是随便写的，每一行恐惧都是你对自己的诚实。当你能把恐惧列出来，你就不再是它的人质。`;
        }
      }

      if (personality) {
        analysis += ` ${personality}${nameCall}。`;
        if (avatarLabel === '稳重' && kept) {
          analysis += ` 你留住了「${kept}」——对于追求稳定的人来说，这可能是唯一会击穿你防线的事。你最怕的不是变化，而是失控。`;
        } else if (avatarLabel === '冒险' && kept) {
          analysis += ` 一个敢于冒险的人，最后留下的恐惧竟然是「${kept}」——这说明在你的字典里，有些东西比冒险本身更值得保护。冒险是手段，守护才是目的。`;
        } else if (avatarLabel === '独立' && kept) {
          analysis += ` 你习惯靠自己，但在你的恐惧清单里，「${kept}」是唯一你不敢独自面对的。独立的人最怕的不是失去帮助，而是失去那个让独立有意义的东西。`;
        }
      }

      analysis += `\n\n你的底线已经替你做了大部分决定。当你知道自己绝对不能失去什么，其他的纠结就都有了参照系。不是"哪个更好"，而是"哪个更不会触碰到我的底线"。这个翻转了的问题，才是你真正需要回答的。`;

      analysis += `\n\n保护好那个你留下来的东西。它不是你的弱点，它是你在这个问题上的全部锚点。如果有一天你真的面对那个选择，只要守住这一条，其他的都可以交给时间来消化。`;

      return analysis;
    }

    case 'value-auction': {
      const personality = avatarPersonalityNote();
      const nameCall = nickname ? `，${nickname}` : '';
      const bidList = Array.isArray(bids) ? bids.sort((a, b) => b.amount - a.amount) : [];
      const skipList = Array.isArray(skipped) ? skipped : [];

      let analysis = `你用${remainingGold != null ? (100 - remainingGold) + '枚' : ''}金币买下了你的价值观。有意思的是——选项会变，但你的价值偏好非常稳定。`;

      if (bidList.length > 0) {
        const top = bidList[0];
        analysis += ` 你出价最高的价值是「${top.name || top.label || ''}」，${top.amount}金币——这是你今天最诚实的告白。`;
        if (bidList.length >= 2) {
          const second = bidList[1];
          analysis += ` 然后是「${second.name || second.label || ''}」，${second.amount}金币。这两个价值的差额本身就在说话——你第一看重的东西，和第二看重的，之间的距离比你想象的要大。`;
        }
        const lowBids = bidList.filter(b => b.amount > 0 && b.amount <= 5);
        if (lowBids.length > 0) {
          analysis += ` 有意思的是你对「${lowBids.map(b => b.name || b.label).join('」「')}」只投了象征性的几枚金币——你不想完全放弃这些价值，但它们在你的心里确实是轻量的。这是一种诚实的表态：重要，但不是最重要。`;
        }
      }

      if (skipList.length > 0) {
        analysis += `\n\n你跳过了「${skipList.map(s => s.name || s.label || s).join('」「')}」。别以为跳过就是不在意——有时候我们跳过某个选择，恰恰是因为不想面对它会赢的结果。`;
      }

      if (remainingGold > 0) {
        analysis += ` 你还剩了${remainingGold}枚金币没有花——你没有把钱全投出去。可能你还在等一个更好的选项出现，也可能你不愿意为眼前的这些价值倾尽所有。这也是一种态度：不是所有东西都值得你全力以赴。`;
      }

      if (personality) {
        analysis += `\n\n${personality}${nameCall}。`;
        if (bidList.length > 0) {
          analysis += ` 以你的性格，把最多金币投给「${bidList[0].name || bidList[0].label}」是一件不意外的事——你的自我认知和你的金钱流向是一致的。这说明你对自己的了解是准确的，不是自我欺骗。`;
        }
      }

      analysis += `\n\n你面对的选择是"${question || ''}"。下次当你在两个选项之间卡住，别光比较选项本身的利弊——问自己一个问题：哪条路更接近你花最多金币买下的那个价值？答案往往就在那里。不是选项决定了你的选择，是你的价值决定了你的选择。你只是在等一个和它匹配的选项出现而已。`;

      return analysis;
    }

    case 'parallel-letters': {
      const personality = avatarPersonalityNote();
      const nameCall = nickname ? `，${nickname}` : '';

      let analysis = `你读了来自未来的信。你在「${optionA || '选项A'}」和「${optionB || '选项B'}」之间读到了不同可能性。`;

      if (highlights) {
        analysis += ` 最能触动你的那些句子不是偶然的——你被一段关于未来的文字击中，是因为那段描述里的某样东西，恰好是你现在最缺的。可能你对「${optionB}」的犹豫不是出于理性计算，而是你不敢想象自己配得上描述中的那个未来。`;
      }

      if (personality) {
        analysis += `\n\n${personality}${nameCall}。`;
        if (highlights) {
          analysis += ` 触动你的那个片段之所以能触动你，恰恰因为它符合你对自己的期待——或者恰恰相反，因为你从来不敢这么期待自己。`;
        }
      }

      analysis += `\n\n信里写的不是预言，是镜子。你被什么打动，就说明你渴望什么。你读到「${optionA}」的未来觉得真实，还是读到「${optionB}」的未来觉得心跳加速？真实感不等于答案，心跳才是。有时候我们选A只是因为A比较安全，但B里的那些让你心跳加快的画面，才是你真正想去的方向。`;

      analysis += `\n\n信的使命不是替你做选择，而是让你看清楚——你在怕什么，又渴望什么。选哪条路其实不那么重要，重要的是你知道自己是带着什么走上去的。带着恐惧上路的人都走得小心翼翼但很稳；带着渴望上路的人走得快但容易摔。你选哪种都没关系，只要别假装自己没感觉。`;

      return analysis;
    }

    case 'friend-room': {
      const personality = avatarPersonalityNote();
      const nameCall = nickname ? `，${nickname}` : '';
      const answerList = Array.isArray(answers) ? answers.filter(a => a.selected && a.selected !== '未作答') : [];

      let analysis = `你答完了10道灵魂拷问，抽到了「${tarotCard || '这张塔罗牌'}」。`;

      if (tarotCard) {
        analysis += ` 塔罗不是预言——它是一面镜子，把你借朋友的眼睛看见的自己摊开在你面前。你抽到的这张牌，正好对应你在这个问题上的心理状态。不信你回头看看这10道题的答案——它们之间的模式和这张牌的寓意有惊人的呼应。`;
      }

      if (answerList.length > 0) {
        const quickAnswers = answerList.filter(a => a.speed === 'fast' || (a.responseTime && parseFloat(a.responseTime) < 1));
        const slowAnswers = answerList.filter(a => a.speed === 'slow' || (a.responseTime && parseFloat(a.responseTime) > 3));
        analysis += `\n\n注意你答题的节奏。`;
        if (quickAnswers.length > 0) {
          analysis += ` 第${quickAnswers.map(a => a.no).join('、')}题你答得很快——这些是你心里已经有答案的问题。`;
        }
        if (slowAnswers.length > 0) {
          analysis += ` 第${slowAnswers.map(a => a.no).join('、')}题你纠结了——这些是你心里还模糊的地带。`;
        }
        analysis += ` 秒选和犹豫之间的差距，就是你知道和不确定的边界。`;
      }

      if (personality) {
        analysis += `\n\n${personality}${nameCall}。你在这10道题里展示出来的思考方式和你的自我认知是吻合的。这说明你是一个对自己有清晰理解的人——你不需要别人来定义你，你自己已经很清楚。但有时候，清楚的人反而更需要被提醒：你心里的那个答案，你其实早就知道。只是需要一个仪式来让你确认。`;
      }

      analysis += `\n\n答案不在水晶球里，在你答每一道题时的本能反应里。今晚的10道题和一张塔罗牌，不是为了算你的命——是为了让你借一个"游戏"的名义，对自己诚实地回答一次。你刚才的回答，比任何朋友的建议都更接近真相。`;

      return analysis;
    }

    case 'diary-analysis':
      return '每一次认真面对自己的选择，你都在变好。这个决定本身，就值得被看见。\n\n回顾你写下的这几个决策，你已经不是在原地打转了——你在用自己的方式理解自己。能在纠结的时候坐下来写一写、想一想，这本身就是一种能力。不是每个人都有这个勇气面对自己。\n\n你笔下的这些纠结，不全是问题。它们是你还没有长大的部分，也是你正在长大的证据。每一次面对，都让你比昨天更清楚自己是谁。';

    default:
      return '每一次认真面对自己的选择，你都在变好。这个决定本身，就值得被看见。\n\n你很勇敢，敢在纠结的时候来找答案——不是每个人都有这个勇气。不管结果如何，你已经在用自己的方式走向更清楚的自己了。';
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
