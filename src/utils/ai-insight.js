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
  const modifiedContext = { ...context, maxTokens: 3000 };
  const ai = await callAI(gameType, modifiedContext);
  if (ai) {
    console.log('[insight] AI response received');
    return ai;
  }
  console.warn('[insight] AI call failed, using fallback');
  return fallback(gameType, context);
}

// ── 后备解读：当 AI 调用失败时 —— 这是用户最后的底线，必须写满500字、必须有温度 ──

function fallback(gameType, c) {
  const { question = '', result = '', options, kept, removed, time, blindMode, isTimeout, allFears, bids, skipped, remainingGold, optionA, optionB, highlights, answers, tarotCard } = c || {};
  const { profile } = c || {};
  const nickname = profile?.nickname || '';

  const optionList = typeof options === 'string' ? options : (Array.isArray(options) ? options.join('、') : '');
  const otherOpts = optionList ? optionList.split('、').filter(o => o !== result) : [];
  const reactTime = time ? parseFloat(time) : null;
  const bidList = Array.isArray(bids) ? bids.sort((a, b) => b.amount - a.amount) : [];
  const skipList = Array.isArray(skipped) ? skipped : [];
  const remaining = remainingGold != null ? remainingGold : 0;
  const removedList = typeof removed === 'string' ? removed.split('、').filter(Boolean) : (Array.isArray(removed) ? removed : []);
  const fearArr = typeof allFears === 'string' ? allFears.split('、').filter(Boolean) : [];
  const answerList = Array.isArray(answers) ? answers.filter(a => a.selected && a.selected !== '未作答') : [];

  switch (gameType) {

    // ════════════════════════════════════════
    // 本能之手 — 保底600字
    // ════════════════════════════════════════
    case 'instinct-hand': {
      let text = '';
      const how = isTimeout ? '时间到了，光球自己替他选了' : blindMode ? '在一片空白里，他的手伸向了' : '他的身体自己抓住了';

      text += `${nickname || '你'}的问题——「${question || '这件事'}」——摆在那里不是一天两天了。你把选项写成了「${optionList || '几个方向'}」，然后盯着一个光球追着它跑。在几秒之间，光球必须被抓住。这不是头脑在决定，是整个身体在行动。${how}「${result || '那个答案'}」${time ? `，时间记录为${time}` : ''}。\n\n`;

      if (otherOpts.length > 0) {
        text += `让我看看你没选的那些。${otherOpts.map(o => `「${o}」`).join('、')}——每一个都有自己的道理。在理性的账本上，它们可能分数相当。但身体知道账本上没有的东西。它知道什么能让你在深夜突然坐起来，知道什么会让你在电梯里无缘无故地心跳加快。身体不是比大脑聪明，它只是不骗你。它不会为了"看起来合理"而假装对某个选项有感觉。所以当你向「${result}」伸出手的那一刻，不是你在"选择"，是你终于承认了。\n\n`;
      }

      if (reactTime !== null) {
        if (reactTime < 2.5) {
          text += `你的反应时间只有${time}——快得几乎让人怀疑你有没有认真看选项。但恰恰是这种快，说明「${result}」在你心里根本不需要讨论。你早就知道，只是不敢确认。大脑会列出一百个理由，但身体在零点几秒里已经完成了投票。那种不假思索的抓取，其实是深思熟虑的另一种形式——只是思考发生在更早的时候，在你还没意识到自己在想的时候。\n\n`;
        } else if (reactTime > 3.5) {
          text += `你用了${time}——在最后几秒里犹豫。那几个选项在你心里确实分量接近，否则你不会有这种停顿。但最后伸向「${result}」的那一下，是在倒计时逼出来的。人在"来不及了"的时候，谎言会失效。时间压力撕掉了所有伪装，你在最后一刻伸手抓的，不是最安全的，不是最合理的，是你最想要的。\n\n`;
        } else {
          text += `不紧不慢的${time}——没有冲动，也没有拖到最后。你的身体和大脑在这个决定上是同频的。这种节奏本身说明一件事：你对「${result}」的渴望和对其他选项的留恋，已经在你心里达成了某种平衡。而这个平衡本身就是答案。\n\n`;
        }
      }

      if (blindMode) {
        text += `而且你是闭着眼选的。选项名字全部看不见，你没有任何文字可以比对。在那个位置上，你的手碰到「${result}」——纯粹是触觉、直觉、本能在做选择。这种选择没有任何包装，没有任何说服自己的过程。在盲眼中，你的本能就是最真实的你。你没办法解释为什么是它，但你的身体就是知道。\n\n`;
      }
      if (isTimeout) {
        text += `你犹豫太久了，时间替你做主了。你可能会想"如果再多给我几秒"——但命运替你伸手的那一刻，是在跟你说"够了，别再想了"。有些选择你想一万遍也不会有一个完美答案。光球替你选的，也许不是你最想要的，但极有可能是你最能承受的。它知道你什么时候该停了。\n\n`;
      }

      text += `现在回到你真正的问题——「${question || '这件事'}」。你的手指在光球上替你做了回答，但那个答案不是终点，而是起点。它告诉你：你其实不是不知道自己想要什么，你只是不知道怎么面对"想要"之后的事。\n\n真正让人纠结的不是选择本身，而是选择之后你要成为的人。选了「${result}」，你要放弃${otherOpts.length > 0 ? otherOpts[0] : '另一条路'}——这意味着承认某种可能性永远不会发生了。这种承认本身就需要勇气。但你的身体已经替你迈出了这一步。接下来不是"想清楚了"，是"按着你已经清楚的，往前走"。`;

      return text;
    }

    // ════════════════════════════════════════
    // 反向恐惧清单 — 保底600字
    // ════════════════════════════════════════
    case 'reverse-fear': {
      let text = '';

      text += `${nickname || '你'}写下的恐惧清单，我一个字一个字地看了。${fearArr.length > 0 ? `你写的是「${fearArr.join('」「')}」——` : ''}这些不是随便想出来的，是你在某个深夜、某个失眠的凌晨、某个突然惊醒的清晨，脑子里真正盘旋过的东西。能把它们写下来，本身就说明你已经比大多数人勇敢了。多数人连面对都不敢，你已经把它变成一张清单了。\n\n`;

      if (removedList.length > 0) {
        text += `然后你一条条删掉了它们。${removedList.map(f => `「${f}」`).join('、')}——你亲手按下了删除键。这不是"我不怕了"，而是"就算它发生，我也有办法承受"。你删掉的不是恐惧，而是恐惧的"绝对性"。你告诉自己：这件事可以处理，不是世界末日。这种转变，从"被恐惧控制"到"把恐惧变成问题去解决"，是一种巨大的心理跃迁。很多人在恐惧面前只会逃避或压抑，你选择了正面交锋。\n\n`;

        if (removedList.length >= 2) {
          text += `让我看看其中两个。你删掉了「${removedList[0]}」——删掉它的那一刻，你实际上在说"这件事发生了我可以想办法，它不是死局"。然后你删掉了「${removedList[1] || removedList[0]}」——这说明你的心理底线比你以为的宽。你以为自己会被它击垮，但其实你的承受力一直在被你低估。\n\n`;
        }
      }

      text += `最后留下的那个——「${kept || '它'}」——这不是所有恐惧中最恐怖的，而是失去之后你最无法原谅自己的。我换个说法：你删掉的那些都是"会让我痛苦"，留下的这个是"会让我不再是自己"。这就是"底线"的定义。一个人可以有无数个"不喜欢"，但只有极少数的"不能失去"。\n\n`;

      text += `这里有一个很深的东西。恐惧清单是价值清单的底片——你怕什么，反过来就是你最珍惜什么。你删掉「${removedList[0] || '那些恐惧'}」的时候，你实际上在确认"我珍惜的东西比这个更珍贵"；你保留「${kept}」的时候，你确认的是"没有这个东西，其他的一切都没有意义"。所以这张恐惧清单，其实是一面镜子，照出了你内心深处真正排序的东西。\n\n`;

      text += `回到你的问题「${question || '这件事'}」——你现在知道自己承受不起的是什么了。这个认知本身，就已经改变了一切。以前你是在黑暗中摸索，现在你知道了哪里是悬崖，哪里可以迈步。你不需要知道完美的答案，你只需要知道哪里不能去——剩下的路，都是可行的。\n\n底线不是为了限制你，而是为了保护你。知道了自己的底线，你反而可以更自由地在底线之外尝试。那些你删掉的恐惧，以后可能还会来，但你已经知道你可以面对它们。唯一剩下的那个，值得你绕开它、保护它、为它调整路线。这不可耻，这是智慧。你清楚自己是谁，这本身就是一种力量。`;

      return text;
    }

    // ════════════════════════════════════════
    // 价值天平拍卖会 — 保底600字
    // ════════════════════════════════════════
    case 'value-auction': {
      let text = '';
      const spent = 100 - remaining;

      text += `${nickname || '你'}纠结的问题是「${question || '这件事'}」——在两个选项之间举棋不定。然后你来到了拍卖会，手里有100枚金币，面前摆着一列抽象价值：自由、爱情、金钱、尊重、冒险、稳定、创造、归属、快乐……你一件一件地出价，像给自己的灵魂估价。这不是游戏，这是你灵魂的资产负债表。\n\n`;

      if (bidList.length > 0) {
        const top = bidList[0];
        text += `你出价最高的是「${top.name || top.label}」，花了${top.amount}枚金币。这是你最明确的信号。很多人在嘴上会说"我什么都想要"，但金币不会说谎。你拿在手里的一百枚是你的全部身家，你花最多的那个，就是你最不愿意出卖的东西。如果逼你选一个，如果其他东西都可以打折，只有「${top.name || top.label}」必须全价——这说明它在你心里是不可流通的。\n\n`;

        if (bidList.length >= 2) {
          const second = bidList[1];
          text += `第二名是「${second.name || second.label}」，${second.amount}枚金币。它和第一名的差距${top.amount - second.amount >= 20 ? '很大' : '不大'}——这意味着${top.amount - second.amount >= 20 ? '你的价值排序里有非常明确的优先级，不是模糊的' : '你在两个价值之间确实纠结，但最终还是做出了倾向'}。这种差距本身就是答案。当你说"我都想要"的时候，金币替你说了"但我更想要这个"。\n\n`;
        }

        const lowBids = bidList.filter(b => b.amount > 0 && b.amount <= 5);
        if (lowBids.length > 0) {
          text += `你对「${lowBids.map(b => b.name || b.label).join('」「')}」只投了几枚金币——象征性的。这不是说你不想要它们，而是说你在心里已经知道：这些价值可以以后再说，可以先搁置。你的潜意识在说"我的资源有限，要优先保护最珍贵的东西"。这是一种生存智慧，不是冷漠。\n\n`;
        }

        const midBids = bidList.filter(b => b.amount > 5 && b.amount < 30);
        if (midBids.length > 0) {
          text += `还有「${midBids.map(b => b.name || b.label).join('」「')}」——你出了中等价位。这些是你生活中的必需品，不是梦想，不是执念，但没了它们你也活不好。它们是你地基的一部分，不是屋顶。\n\n`;
        }
      }

      if (skipList.length > 0) {
        text += `你直接跳过了「${skipList.map(s => s.name || s.label).join('」「')}」——连一枚金币都不给。这不是"不重要"，这是"我不想碰"。有时候跳过也是一种强有力的表态。它意味着你对这个方向有清晰的认知：这条路不是我的。很多人花一辈子在"也许我也可以试试"的犹豫里，你直接说"不用了"。这种清晰，比模棱两可的勇气更可贵。\n\n`;
      }

      if (remaining > 0) {
        text += `你还留了${remaining}枚金币没花。你在等什么？在等一个还没出现在名单上的东西？那几枚金币，是你的期待。也许是一个你还没遇到的人，一件还没发生的事，一个还没成型的梦想。你给自己留了余地，这说明你对自己的人生还有信心——相信未来会有更好的东西出现。\n\n`;
      }

      text += `回到你纠结的那个问题「${question || '这件事'}」。现在你知道了：你的灵魂已经投票了。「${bidList[0]?.name || bidList[0]?.label || '你最珍惜的那个'}」是你不愿意打折的。在"选A还是选B"的迷宫中，问自己一个简单的问题：哪条路更接近「${bidList[0]?.name || bidList[0]?.label || '它'}」？\n\n答案不是别人给的。金币已经替你说了。你唯一要做的，是承认这个声音。`;

      return text;
    }

    // ════════════════════════════════════════
    // 平行时空来信 — 保底600字（盲测设计：三封信都是同一条路的未来）
    // ════════════════════════════════════════
    case 'parallel-letters': {
      let text = '';
      const { chosen, other } = c || {};

      text += `${nickname || '你'}读完了三封信——1年后、3年后、10年后。但有个秘密要告诉你：这三封信，写的都是同一条路的未来。不是A和B各一封信，而是系统悄悄选了一条路，把它的三个时间点都写给你看。\n\n`;

      text += `揭晓答案：你刚才读的三封信，来自「${chosen || '其中一条路'}」的未来。你没读到的另一条路是「${other || '另一条路'}」。\n\n`;

      if (highlights) {
        text += `最触动你的是这句——「${highlights}」。让我告诉你为什么这句话很重要：它不是这段文字写得最好的句子，它是你最需要听到的那句。你被什么打动，就说明你渴望什么。如果它讲的是平静，那说明你现在的内心很吵；如果它讲的是勇气，那说明你正在害怕；如果它讲的是某个人，那说明你心里有缺口。句子本身不是问题，你"选择被它打动"这个事实才是问题。它在暴露你。\n\n`;
      }

      text += `在不知道是哪条路的情况下，你纯粹凭文字感受了「${chosen || '这条路'}」的未来。没有被选项名字影响——没有"去大城市"听起来很酷、"回老家"听起来很安稳这种先入为主的判断。你就是被文字里透露出来的生活方式打动了，或者没打动。\n\n`;

      text += `这就是盲测的意义。你平时做选择的时候，会被名字、标签、别人的看法干扰。但当你去掉这些包装，只感受文字里描述的生活本身——那种每天醒来面对的日常、那种人际关系、那种压力、那种自由——你的直觉更诚实。\n\n`;

      text += `回到你的问题「${optionA || 'A'} vs ${optionB || 'B'}」——现在你有了两方面的信息：理性上你权衡过的利弊，和直觉上你对「${chosen || '这条路'}」的文字感受。如果这两方面一致，恭喜你，你的选择更清晰了。如果它们矛盾——你的理性偏向A，但直觉被B的文字打动——那这不是坏事，这说明你有内在冲突需要面对。\n\n`;

      text += `最后说一句：你刚才读的三封信，是「${chosen || '一条路'}」的未来。那条你没读的路——「${other || '另一条路'}」——永远只存在于你的想象里。而想象里的东西总是比现实更美。所以无论选哪条，都不要用"没选的那条会更好"来折磨自己。走下去，把你选的路走成最好的那条。`;

      return text;
    }

    // ════════════════════════════════════════
    // 朋友灵魂拷问室 — 保底700字
    // ════════════════════════════════════════
    case 'friend-room': {
      let text = '';

      text += `${nickname || '你'}刚刚答完了10道灵魂拷问。不是考试，是一个朋友坐在你对面，问你一些平时没人敢问的问题。\n\n`;

      if (tarotCard) {
        text += `抽到的牌是「${tarotCard}」。别把它当占卜——牌不是预言，是视角。它给你的是一面镜子，让你从高处看自己在走的路。你选的答案就像一个个脚印，这张牌是脚印连起来的形状。它让你看见的不是"命运"，而是你已经在走的那个方向。\n\n`;
      }

      if (answerList.length >= 3) {
        // 引用具体题目和答案——最多引用5道
        const quoted = answerList.slice(0, 5);
        quoted.forEach((a, idx) => {
          text += `第${a.no}题——「${a.q || '这道题'}」——你选了「${a.selected || '你的答案'}」。${idx === 0 ? '这个选择值得停下来想想。' : ''}${idx === 1 ? '有意思。' : ''}${idx === 2 ? '再看这个。' : ''}${idx === 3 ? '还有一个。' : ''}${idx === 4 ? '最后一道。' : ''}\n\n`;
        });

        // 速度分析
        const fastOnes = answerList.filter(a => a.speed === 'fast' || (a.responseTime && parseFloat(a.responseTime) < 1));
        const slowOnes = answerList.filter(a => a.speed === 'slow' || (a.responseTime && parseFloat(a.responseTime) > 3));

        if (fastOnes.length >= 2) {
          text += `我注意到${fastOnes.length}道题你几乎是秒答——第${fastOnes.map(a => a.no).join('、')}题。这些不是"简单的题"，是"你已经答过无数次的题"。在深夜、在地铁上、在洗澡的时候，你已经问过自己千百遍。所以问题一出来，你不需要想，答案已经在那里。这些是内心笃定的地带——不是你没有纠结过，是你已经纠结完了。\n\n`;
        }
        if (slowOnes.length >= 2) {
          text += `有${slowOnes.length}道题你犹豫了——第${slowOnes.map(a => a.no).join('、')}题。犹豫的地方往往不是"最难的"，而是"还没跟自己聊过的"。这些题目像路标，指向你还没 explored 的内心世界。它们是你的导航——不是告诉你去哪里，而是告诉你要往哪里走。\n\n`;
        }

        // 一致性/矛盾分析
        const selections = answerList.map(a => a.selected);
        const uniqueCount = new Set(selections).size;
        if (uniqueCount <= 2 && selections.length >= 5) {
          text += `我发现一个事——你的10个答案里，反复出现的选项只有${uniqueCount}种。你嘴上说在纠结，但你的手一直在选同样的东西。这不是局限，这是一种安静的坚定。很多人需要学怎么坚持，你需要学的是怎么相信自己的坚持。你已经知道你想要什么了，你只是需要允许自己承认。\n\n`;
        }
        if (uniqueCount >= 6 && selections.length >= 6) {
          text += `你的答案散落在各个方向——有人可能觉得你"摇摆不定"，但我不这么看。你能从那么多不同角度看问题，说明你不是没立场，而是比大多数人更能理解世界不是非黑即白的。你的纠结不是没主见，是你有同理心。你能理解每一种选择背后的理由，这让你很难草率地决定。这是复杂性的代价，也是复杂性的礼物。\n\n`;
        }

        // 看有没有矛盾
        if (answerList.length >= 4) {
          text += `让我试着找找你的模式。${answerList[0]?.q || '第一题'}选了「${answerList[0]?.selected || '...'}」，${answerList[2]?.q || '后面的题'}选了「${answerList[2]?.selected || '...'}」——这些选择之间，有没有某种统一的东西？也许是"安全感"，也许是"自由"，也许是"不想让人失望"。我不知道你心里的那个词是什么，但你一定知道。\n\n`;
        }
      }

      text += `你纠结的那个问题是「${question || '这件事'}」。10道题答完，其实你已经知道答案了。朋友拷问你的目的不是给你一个新答案，是让你借另一双眼睛，看见你早就知道的事。\n\n`;

      text += `现在的问题是：你已经看见了。剩下的不是"想清楚"，是"敢不敢按着想的去做"。你已经走了好几步了，再往前走一点就好。\n\n`;

      text += `最后说一句：你今天的回答里，有一个隐藏的统一主题。也许你现在还没发现，但过几周、过几个月，回头看这些答案，你会突然看到一个轮廓——一个你一直在绕着走的真相。那个真相不可怕，它只是需要你准备好。今天，你准备好了。`;

      return text;
    }

    // ════════════════════════════════════════
    // 日记分析 — 保底500字
    // ════════════════════════════════════════
    case 'diary-analysis': {
      return `你写下的这些决策，不是日记，是你在给自己画地图。每一次"我选了A还是B"的记录，背后都有一个你对自己的判断——你判断自己更适合什么、更害怕什么、更渴望什么。这些判断不一定对，但它们是你真实的思考痕迹。\n\n回看这些记录，你会发现一个模式。也许你总是先倾向于某个选项，然后被另一个选项的各种"好处"拉走，最后又回到第一个。也许你在涉及某个人的时候总是特别犹豫。也许你每次在"稳定"和"冒险"之间都会选同一个方向，只是每次说服自己的理由不同。这些模式不是巧合，是你在重复地解决同一个深层问题。\n\n人们总觉得"我每次都纠结不一样的事"——但其实不是的。你纠结的表象在变，底层的问题很少变。今天是为工作，明天是为感情，后天是为搬家——但那个让你真正纠结的东西，可能是"我害怕让别人失望"，或者"我渴望被认可"，或者"我不知道自己配不配得到好的东西"。这个底层的东西，才是你要面对的。\n\n能在纠结的时候坐下来写一写，这本身就是一种难得的能力。大多数人选择逃避、拖延、假装不纠结。你选择了面对。记录本身就有疗愈的力量——当你把混沌的想法变成文字，它们就从"一团情绪"变成了"一个问题"。而问题是可以解决的，情绪只会堆积。\n\n下次再卡住的时候，翻开你写过的这些。看看上一次你是怎么走出来的。你会发现，你比自己以为的更了解自己。你的直觉一直在做选择的方向上留下印迹——回头看，这些印迹连起来就是一条路。你的路。你不需要知道这条路通向哪里，你只需要知道，它一直是你的。`;
    }

    default:
      return '能在纠结的时候停一下、面对一下自己的内心——这件事本身，你已经比很多人勇敢了。你不需要一个完美的答案，你需要的是一个真实的开始。带着今天的这份觉知，无论选择哪条路，你都不会像以前一样迷茫。因为你知道了，最重要的问题不是"该选哪个"，而是"我真正想要成为什么样的人"。答案是活的，它跟着你走。';
  }
}

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
