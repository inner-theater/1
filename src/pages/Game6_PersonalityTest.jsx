import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarConfigById } from '../utils/profile';

// 大五人格题库 — 每维度10题，共50题，每次随机抽30题
const FULL_QUESTION_BANK = [
  { dim: 'openness', text: '我对艺术、音乐或文学有浓厚的兴趣', reverse: false },
  { dim: 'openness', text: '我喜欢尝试新事物，哪怕有些冒险', reverse: false },
  { dim: 'openness', text: '我经常沉浸在自己的想象和思考中', reverse: false },
  { dim: 'openness', text: '我喜欢探索没去过的地方', reverse: false },
  { dim: 'openness', text: '我对抽象的理论和哲学问题感兴趣', reverse: false },
  { dim: 'openness', text: '我容易被一首歌或一幅画深深打动', reverse: false },
  { dim: 'openness', text: '我不喜欢一成不变的日常生活', reverse: false },
  { dim: 'openness', text: '我喜欢了解不同文化和观点', reverse: false },
  { dim: 'openness', text: '我更喜欢熟悉和常规的事物', reverse: true },
  { dim: 'openness', text: '别人觉得我脑洞很大，总有一些新奇的想法', reverse: false },
  { dim: 'conscientiousness', text: '我会把东西整理得井井有条', reverse: false },
  { dim: 'conscientiousness', text: '我做事总是有始有终，不会半途而废', reverse: false },
  { dim: 'conscientiousness', text: '我喜欢提前规划而不是临时抱佛脚', reverse: false },
  { dim: 'conscientiousness', text: '答应别人的事我一定会尽力做到', reverse: false },
  { dim: 'conscientiousness', text: '我经常把东西放得到处都是', reverse: true },
  { dim: 'conscientiousness', text: '我会给自己设定目标并按计划执行', reverse: false },
  { dim: 'conscientiousness', text: '出门前我会反复确认是否忘带东西', reverse: false },
  { dim: 'conscientiousness', text: '有时候我会拖延到最后一刻才动手', reverse: true },
  { dim: 'conscientiousness', text: '我喜欢按照日程表来安排一天', reverse: false },
  { dim: 'conscientiousness', text: '我对细节很敏感，能发现别人忽略的小错误', reverse: false },
  { dim: 'extraversion', text: '在人群中我通常是活跃气氛的那个人', reverse: false },
  { dim: 'extraversion', text: '认识新朋友让我感到兴奋', reverse: false },
  { dim: 'extraversion', text: '跟人聊天让我充满能量而不是感到疲惫', reverse: false },
  { dim: 'extraversion', text: '我更喜欢一个人待着而不是参加聚会', reverse: true },
  { dim: 'extraversion', text: '在会议上我通常是第一个发言的人', reverse: false },
  { dim: 'extraversion', text: '我喜欢安静的环境胜过热闹的场合', reverse: true },
  { dim: 'extraversion', text: '在陌生的社交场合我会主动找人聊天', reverse: false },
  { dim: 'extraversion', text: '人多的场合让我感到被消耗', reverse: true },
  { dim: 'extraversion', text: '我享受成为关注的焦点', reverse: false },
  { dim: 'extraversion', text: '比起一群人，我更喜欢和几个密友深度交流', reverse: true },
  { dim: 'agreeableness', text: '看到别人遇到困难，我会主动去帮忙', reverse: false },
  { dim: 'agreeableness', text: '我很少跟人发生争执，宁可自己退一步', reverse: false },
  { dim: 'agreeableness', text: '我相信世界上大多数人是善良的', reverse: false },
  { dim: 'agreeableness', text: '别人说我是个容易被说服的人', reverse: false },
  { dim: 'agreeableness', text: '即使不喜欢一个人我也会保持基本的礼貌', reverse: false },
  { dim: 'agreeableness', text: '我更倾向于直接指出别人的错误', reverse: true },
  { dim: 'agreeableness', text: '看感人的电影或故事时我容易流泪', reverse: false },
  { dim: 'agreeableness', text: '我总是先考虑对方感受再说自己的看法', reverse: false },
  { dim: 'agreeableness', text: '如果有人插队我会直接上前提醒', reverse: true },
  { dim: 'agreeableness', text: '朋友说我是个可以依靠和倾诉的人', reverse: false },
  { dim: 'neuroticism', text: '我常常感到紧张或焦虑', reverse: false },
  { dim: 'neuroticism', text: '一点小事就能影响我一整天的心情', reverse: false },
  { dim: 'neuroticism', text: '大多数时候我对自己的生活感到满意', reverse: true },
  { dim: 'neuroticism', text: '在压力下我依然能保持冷静和理智', reverse: true },
  { dim: 'neuroticism', text: '我很少为过去的事情后悔或反复纠结', reverse: true },
  { dim: 'neuroticism', text: '别人无意间的一句话能让我思来想去很久', reverse: false },
  { dim: 'neuroticism', text: '我比身边的人更容易感到担心', reverse: false },
  { dim: 'neuroticism', text: '不管发生什么，我大多数时候都比较平静', reverse: true },
  { dim: 'neuroticism', text: '糟糕的天气会让我一整天都闷闷不乐', reverse: false },
  { dim: 'neuroticism', text: '面对突发状况时我能很快冷静地想办法', reverse: true },
];

// 随机抽取并打乱题目
function getRandomQuestions(count = 30) {
  const perDim = Math.floor(count / 5);
  const extra = count - perDim * 5;
  const dims = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

  const selected = [];
  dims.forEach((dim, i) => {
    const pool = FULL_QUESTION_BANK.filter(q => q.dim === dim);
    const take = perDim + (i < extra ? 1 : 0);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, take).map((q, idx) => ({ ...q, id: selected.length + idx + 1 })));
  });

  return selected.sort(() => Math.random() - 0.5).map((q, i) => ({ ...q, id: i + 1 }));
}

const DIM_LABELS = {
  openness: { name: '开放性', emoji: '🎨', desc: '对新事物、新体验的接纳和好奇程度' },
  conscientiousness: { name: '尽责性', emoji: '📋', desc: '自律、有条理、有目标感的程度' },
  extraversion: { name: '外向性', emoji: '🎤', desc: '从社交和外部刺激中获取能量的倾向' },
  agreeableness: { name: '宜人性', emoji: '🤝', desc: '对他人友善、合作和信任的程度' },
  neuroticism: { name: '情绪稳定性', emoji: '🧘', desc: '情绪的波动程度和抗压能力' },
};

const SUPABASE_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';

async function getPersonalityAnalysis(scores, profile) {
  const context = {
    gameType: 'personality-test',
    context: {
      scores,
      profile,
      maxTokens: 2500,
    },
  };
  try {
    const r = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    });
    const d = await r.json();
    return d.content || null;
  } catch {
    return null;
  }
}

function fallbackAnalysis(scores) {
  const sorted = Object.entries(scores)
    .map(([k, v]) => ({ dim: k, score: v, ...DIM_LABELS[k] }))
    .sort((a, b) => b.score - a.score);

  const top = sorted[0], second = sorted[1], third = sorted[2], fourth = sorted[3], bottom = sorted[4];
  const typeName = getPersonalityType(sorted);

  let a = `${typeName}\n\n`;

  // 一、总览
  a += `📊 你的五维画像总览\n\n`;
  a += `这是你的五维人格光谱，从最强到最弱依次为：\n`;
  a += `「${top.name}」${top.score}分 → 「${second.name}」${second.score}分 → 「${third.name}」${third.score}分 → 「${fourth.name}」${fourth.score}分 → 「${bottom.name}」${bottom.score}分\n\n`;
  a += `这意味着你的核心驱动力来自${top.name}，而${bottom.name}则是你相对松弛的区域。\n\n`;

  // 二、核心维度深度解析
  a += `🎯 核心维度深度解析\n\n`;
  a += `【${top.emoji} ${top.name} —— 你的最强维度（${top.score}分）】\n${getDimDeepDesc(top.dim, top.score)}\n`;
  a += `在生活场景中，这表现为：${getLifeManifest(top.dim, top.score)}\n\n`;

  a += `【${second.emoji} ${second.name} —— 你的第二维度（${second.score}分）】\n${getDimDeepDesc(second.dim, second.score)}\n`;
  a += `它如何影响你：${getLifeManifest(second.dim, second.score)}\n\n`;

  a += `【${bottom.emoji} ${bottom.name} —— 你的待开发领域（${bottom.score}分）】\n${getLowDesc(bottom.dim, bottom.score)}\n`;
  a += `对你来说可能意味着：${getChallengeArea(bottom.dim, bottom.score)}\n\n`;

  // 三、双维度组合分析
  a += `🔗 特质组合透视\n\n`;
  const combo = `${top.dim}_${second.dim}`;
  const comboDesc = getComboDesc(combo, sorted);
  a += `${comboDesc}\n\n`;

  // 四、人际与职业洞察
  a += `👥 人际与职业洞察\n\n`;
  a += `在人际关系中：${getRelationshipInsight(sorted)}\n\n`;
  a += `适合你的环境：${getWorkEnv(sorted)}\n\n`;

  // 五、成长建议
  a += `🌱 成长建议\n\n`;
  a += `发挥优势：${getStrengthAdvice(top, second)}\n\n`;
  a += `补足短板：${getGrowthAdvice(bottom, fourth)}\n\n`;

  // 六、总结
  a += `💡 总结\n\n`;
  a += `${getSummary(sorted)}\n\n`;

  // 七、数据
  a += `📈 你的五维数据\n`;
  a += `${top.emoji}${top.name} ${top.score}/10 · ${second.emoji}${second.name} ${second.score}/10 · ${third.emoji}${third.name} ${third.score}/10 · ${fourth.emoji}${fourth.name} ${fourth.score}/10 · ${bottom.emoji}${bottom.name} ${bottom.score}/10\n\n`;
  a += `记住：人格是流动的河流，不是凝固的雕像。了解自己，是为了更自由地生活。`;

  return a;
}

function getPersonalityType(sorted) {
  const top = sorted[0], second = sorted[1];
  const types = {
    openness_extraversion: '探索者型',
    openness_agreeableness: '人文创意型',
    openness_conscientiousness: '理想实践型',
    conscientiousness_extraversion: '高效领袖型',
    conscientiousness_agreeableness: '可靠守护型',
    conscientiousness_neuroticism: '完美主义型',
    extraversion_agreeableness: '社交温暖型',
    extraversion_neuroticism: '感性表达型',
    agreeableness_neuroticism: '共情敏感型',
    openness_neuroticism: '敏感创造型',
  };
  const key = `${top.dim}_${second.dim}`;
  const emojis = { openness:'🌍', conscientiousness:'🛡️', extraversion:'🚀', agreeableness:'🎨', neuroticism:'🧠' };
  const e1 = emojis[top.dim] || '✨', e2 = emojis[second.dim] || '✨';
  const name = types[key] || types[`${second.dim}_${top.dim}`] || '独特组合型';
  return `${e1} ${name} ${e2}`;
}

function getDimDeepDesc(dim, score) {
  if (score >= 8) {
    const high = {
      openness: '你对新鲜事物有着本能的热情。一本书、一首没听过的歌、一个没去过的城市——都能点燃你。你不是在"猎奇"，你是在用体验来理解世界。这种开放不是浮躁，是对生活在真诚回应。',
      conscientiousness: '你有一种让人信赖的力量。不是控制欲，而是一种"说到做到"的自我要求。你知道自己要什么，也愿意一步步走过去。偶尔放松一下不是失败，是战略性的充电。',
      extraversion: '你在人群中充电。社交对你来说不是任务，是能量来源。你能让冷场变热闹，让陌生人变朋友。独处对你来说是修行，但热闹才是你的主场。',
      agreeableness: '你天生有一副柔软的盔甲——你看到别人的痛苦，也愿意伸出手。不是为了被喜欢，是因为你真的在乎。这种善良不是软弱，是一种深刻的选择。',
      neuroticism: '你的敏感是你最敏感的雷达。你能捕捉到别人忽略的情绪波动，但也容易把这些信号放大。你的感知力是天赋——学会和它做朋友，而不是对抗它。',
    };
    return high[dim] || '这是你最闪耀的维度。';
  }
  const mid = {
    openness: '你对新鲜事物保持适度开放——不排斥新体验，但也不会盲目追逐。这种平衡让你既不会被变化淹没，也不会在舒适区里生锈。',
    conscientiousness: '你是有弹性的自律者——该认真时不含糊，该放松时也不跟自己较劲。这种游刃有余比极端自律更难。',
    extraversion: '你在独处和社交之间找到了自己的节奏。不勉强自己热闹，也不拒绝真诚的连接。独处不孤独，社交不消耗——这是很高级的状态。',
    agreeableness: '你有同理心但也有边界——你知道什么时候该帮忙，什么时候该保护自己的能量。这种平衡比一味讨好或冷漠都难得多。',
    neuroticism: '你的情绪像一个温和的天气预报——偶尔多云但大部分时候晴朗。你不是没有情绪，而是学会了和它们共处。',
  };
  return mid[dim] || '这是你性格中稳定而真实的一面。';
}

function getLowDesc(dim, score) {
  if (score <= 3) {
    const low = {
      openness: '你偏爱熟悉和可预测的世界。常规不是束缚，是你搭建安全感的砖块。但别忘了偶尔推开窗——外面的风有时候很好闻。',
      conscientiousness: '你更随性自由，不喜欢被条条框框绑住。生活对你来说是一场即兴表演，而不是一份待办清单。创造力往往在你"不按计划来"的瞬间迸发。',
      extraversion: '你从独处中汲取能量。安静不是你的弱点，是你的秘密花园。你不是不喜欢人——你只是需要更多时间跟自己待着。',
      agreeableness: '你有清晰的边界，不轻易妥协。这是你保护自己的方式——不是冷漠，是懂得什么时候说"不"。适当柔软一下，有时候会有惊喜。',
      neuroticism: '你的情绪像一棵扎根很深的树——风雨动得了枝叶，动不了根。这份稳定是非常珍贵的心理素质，是你在这个动荡世界里的压舱石。',
    };
    return low[dim] || '这是你性格中独特的一面。';
  }
  return `这是一个中等偏低的得分——你在这方面的特质相对内敛，但不会影响你的整体人格格局。`;
}

function getLifeManifest(dim, score) {
  const m = {
    openness: score >= 8 ? '你会是那个看了展览回来兴奋地分享的人，周末突然决定去一个没听过的小镇。你的生活里永远有"接下来试试什么"的期待。' : '你对新事物有选择性——挑自己真正感兴趣的领域深入。这是一种成熟的开放。',
    conscientiousness: score >= 8 ? '你的桌面整洁，开会前5分钟就在会议室准备好了。朋友遇事第一个想起你——因为他们知道你会认真对待。' : '你不会被计划打乱节奏而暴躁，你的弹性让你适应变化比高度自律的人更快。',
    extraversion: score >= 8 ? '周末不出门等于没过周末。你能在一个下午赶三个局而且越聊越兴奋。社交是你生活的重要跑道。' : '你不需要靠人多来确认存在感。安静的书店、一个人的咖啡——这些是你的充电桩。',
    agreeableness: score >= 8 ? '同事忘带午饭你会分一半，朋友半夜心情不好你秒回。你的共情力让你成为别人"想说心里话第一个想到的人"。' : '你不会为了维持表面的和谐而委屈自己。这在需要保护能量的时候特别有力量。',
    neuroticism: score >= 8 ? '你像一台高敏感的天气雷达——别人还没察觉的情绪变化你已经在处理了。这让你在艺术、创作、人事洞察方面有不可替代的敏锐。' : '你是这艘船上的压舱石。风暴时周围人不由自主看向你——因为你的稳定让人安心。',
  };
  return m[dim] || '这是你在日常中最自然的状态。';
}

function getChallengeArea(dim, score) {
  const c = {
    openness: '你习惯了熟悉和可预测的节奏。但在不确定的时代，偶尔跳出舒适区可能会有意外收获——哪怕只是换一条上班的路。',
    conscientiousness: '自由对你来说比秩序更重要。如果在重要的事上容易拖延，试试"只做5分钟"——最难的是开始。',
    extraversion: '独处是你的根基而非逃避。偶尔拉一个信任的人出来走走，不是为了社交，是为了听到不一样的声音。',
    agreeableness: '你擅长说"不"，知道边界在哪。偶尔柔软一次，给对方一个意料之外的善意，可能会收获一段没想到的关系。',
    neuroticism: '你太稳定了，可能不太理解别人的情绪波动。尝试感受一下身边人的脆弱——不是为了改变他们，是为了走进他们。',
  };
  return c[dim] || '保持现在这样就很不错。';
}

function getComboDesc(combo, sorted) {
  const top = sorted[0], second = sorted[1];
  const map = {
    openness_extraversion: '既好奇又敢表达。你对世界抱着探索的心态，也乐于把发现的乐趣传递出去。你身边有一批被你带动的人——你可能没意识到自己是天然的创作者。',
    openness_agreeableness: '你的好奇心和同理心形成独特配合：你不是在"观察"世界，而是在"感受"世界。这种特质让你在需要深度共情的领域特别出色。',
    openness_conscientiousness: '你既有创新精神又有执行力——非常罕见的组合。你最擅长把还在胚胎里的概念稳稳孵出来。不过别对自己太苛刻，不是每个想法都必须实现。',
    conscientiousness_extraversion: '你能站出来扛事——既有计划性又有表达力。在团队里你可能是自然的核心，不是因为你说了算，而是因为你说得清、做得到。',
    conscientiousness_agreeableness: '你是身边人的"定心丸"。你不声不响把事做得妥妥帖帖，还替别人多想一步。也把这份用心用在自己身上。',
    conscientiousness_neuroticism: '高标准配一颗敏感的心——完美主义的经典配方。你对自己很严格，也容易因小波动而自我怀疑。做到80分的你在别人眼里已经是95分了。',
    extraversion_agreeableness: '天生的人际连接者。你能在人群中自然发光，也真心在乎每个人。只是要警惕：照顾所有人的感受会让你忘了自己。',
    extraversion_neuroticism: '你的情绪像冲浪——能体验到极高的兴奋也容易受情绪拉扯。这是艺术家的灵魂配置：你体验世界的深度别人无法企及。',
    openness_neuroticism: '内心世界精彩又复杂——能同时看到六层想象和六层恐惧。独处是你能量的来源。找到一种方式把这些感受表达出来：这是最好的自我调节。',
    agreeableness_neuroticism: '高度共情——别人的忧愁你感同身受，自己的情绪也被外界牵动。这让你成为"特别懂我"的人。但要记得定期拧干自己。',
  };
  for (const key of Object.keys(map)) {
    const parts = key.split('_');
    if (combo.includes(parts[0]) && combo.includes(parts[1])) return map[key];
  }
  return `你的「${top.name}」和「${second.name}」形成了一种独特组合。不要试图成为别人，你已经很好了。`;
}

function getRelationshipInsight(sorted) {
  const e = sorted.find(s => s.dim === 'extraversion');
  const a = sorted.find(s => s.dim === 'agreeableness');
  const n = sorted.find(s => s.dim === 'neuroticism');
  let r = '';
  if (e && e.score >= 7) r += '你喜欢与人相处的过程本身。你是主动联系人的人。注意别把社交当义务——偶尔沉默不会让关系变弱。';
  else r += '你对关系有选择性而非数量的追求。少量深度连接比大规模社交对你更有价值。你珍视那种"不用社交"的关系。';
  if (a && a.score >= 7) r += ' 你在关系中更擅长倾听而非表达需求。好关系是双向的——偶尔"麻烦"别人不是负担，反而让对方有机会靠近你。';
  if (n && n.score >= 7) r += ' 你在关系中敏感度很高——容易捕捉到对方微妙的情绪变化。这是天赋，但也让你容易在关系中消耗自己。';
  return r;
}

function getWorkEnv(sorted) {
  const top = sorted[0];
  const envs = {
    openness: '需要创意和新鲜感的领域——设计、内容创作、研发。重复性的工作会消耗你。',
    conscientiousness: '结构化、有清晰目标和反馈的环境——管理、工程、财务。你会在有掌控感的系统里如鱼得水。',
    extraversion: '与人频繁互动的工作——销售、教育、客户关系。独狼式的工作会让你枯竭。',
    agreeableness: '以人为核心的工作——咨询、医疗护理、社会工作。帮别人成长给你最大的满足感。',
    neuroticism: '需要深度思考和感知的环境——写作、艺术、研究、策略。你比别人能看到更深层的问题。',
  };
  return envs[top.dim] || '一个能发挥你核心优势的环境——既不过度消耗你较弱的一面，也不浪费你最强的一面。';
}

function getStrengthAdvice(top, second) {
  return `有意识地使用「${top.name}」作为核心引擎。同时用「${second.name}」辅助——它能帮你把优势落地或传播。不要试图变得"均衡"——你最大的价值就在于你的不对称优势。`;
}

function getGrowthAdvice(bottom, fourth) {
  return `对于「${bottom.name}」这个相对较弱的维度，目标是"不拖后腿"而非"超越自己"。可以在安全环境做小的低风险尝试。同样，「${fourth.name}」虽排倒数第二，也在你的整体人格里扮演了意想不到的平衡角色。`;
}

function getSummary(sorted) {
  const top = sorted[0], bottom = sorted[4];
  return `你不是可以被简单定义的人。但这张画像至少让你看清了自己轮廓：最强的是${top.name}，这是你的超级武器；最容易忽视的是${bottom.name}，这不是缺陷，只是暗区。最高级的人格状态不是"完美平衡"，而是"知道自己的形状"。今天的你已经比很多人更了解自己了——这值得开心。`;
}

// Canvas 人格卡片
async function generateCard(scores, profile, nickname) {
  const W = 750, H = 1200;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const C = W / 2;

  // 深色渐变背景
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0a0612');
  bgGrad.addColorStop(0.4, '#10081e');
  bgGrad.addColorStop(1, '#080410');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 多层光晕
  const glow1 = ctx.createRadialGradient(C, 280, 20, C, 280, 550);
  glow1.addColorStop(0, 'rgba(140,80,200,0.10)');
  glow1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  // 顶部装饰线
  ctx.strokeStyle = 'rgba(180,140,220,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 48); ctx.lineTo(W - 60, 48); ctx.stroke();

  // 头像区域
  const avatarCfg = profile?.avatar ? getAvatarConfigById(profile.avatar) : null;
  ctx.save();
  ctx.shadowColor = 'rgba(160,100,220,0.3)';
  ctx.shadowBlur = 20;
  const avatarGrad = ctx.createLinearGradient(C - 30, 78, C + 30, 138);
  avatarGrad.addColorStop(0, avatarCfg?.bg?.[0] || '#7c3aed');
  avatarGrad.addColorStop(1, avatarCfg?.bg?.[1] || '#a78bfa');
  ctx.fillStyle = avatarGrad;
  ctx.beginPath();
  ctx.arc(C, 108, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '26px serif';
  ctx.textAlign = 'center';
  ctx.fillText(avatarCfg?.emoji || '👤', C, 118);

  const displayName = nickname || '我';
  ctx.fillStyle = 'rgba(235,220,245,0.9)';
  ctx.font = 'bold 20px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(displayName, C, 168);

  // 人格类型标签
  const sorted = Object.entries(scores)
    .map(([k, v]) => ({ dim: k, score: v, ...DIM_LABELS[k] }))
    .sort((a, b) => b.score - a.score);
  const typeName = getPersonalityType(sorted);
  ctx.fillStyle = 'rgba(180,140,220,0.5)';
  ctx.font = '13px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('内心剧场 · 人格测试', C, 192);

  // 人格类型大标签
  ctx.fillStyle = '#c084fc';
  ctx.font = 'bold 24px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(typeName, C, 228);

  // ====== 雷达图 ======
  const radarCx = C, radarCy = 440, radarR = 130;
  const dimOrder = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const angles = dimOrder.map((_, i) => -Math.PI / 2 + (i / dimOrder.length) * Math.PI * 2);

  // 背景网格
  for (let level = 2; level <= 10; level += 2) {
    ctx.strokeStyle = `rgba(180,140,220,${0.04 + level * 0.01})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    angles.forEach((a, i) => {
      const r = (level / 10) * radarR;
      const x = radarCx + Math.cos(a) * r;
      const y = radarCy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }

  // 轴线
  angles.forEach(a => {
    ctx.strokeStyle = 'rgba(180,140,220,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(radarCx, radarCy);
    ctx.lineTo(radarCx + Math.cos(a) * radarR, radarCy + Math.sin(a) * radarR);
    ctx.stroke();
  });

  // 数据填充
  const dataPoints = dimOrder.map((dim, i) => {
    const score = scores[dim] || 5;
    const r = (score / 10) * radarR;
    return { x: radarCx + Math.cos(angles[i]) * r, y: radarCy + Math.sin(angles[i]) * r };
  });

  ctx.fillStyle = 'rgba(168,139,250,0.15)';
  ctx.beginPath();
  dataPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(192,132,252,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  dataPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.stroke();

  // 数据点
  dataPoints.forEach(p => {
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 维度标签
  dimOrder.forEach((dim, i) => {
    const labelX = radarCx + Math.cos(angles[i]) * (radarR + 36);
    const labelY = radarCy + Math.sin(angles[i]) * (radarR + 36);
    const d = DIM_LABELS[dim];
    ctx.fillStyle = 'rgba(220,200,240,0.8)';
    ctx.font = '13px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.emoji, labelX, labelY - 10);
    ctx.fillStyle = 'rgba(200,180,220,0.6)';
    ctx.font = '10px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(`${d.name} ${scores[dim] || 0}`, labelX, labelY + 8);
  });

  // ====== 底部：分数条 + 简短描述 ======
  const barStartY = 680;
  const barH = 40;
  const barGap = 12;
  const barLX = 140;
  const barColors = ['#c084fc', '#a78bfa', '#818cf8', '#7dd3fc', '#67e8f9'];

  sorted.forEach((item, i) => {
    const y = barStartY + i * (barH + barGap);
    const maxW = W - barLX - 70;
    const w = (item.score / 10) * maxW;

    ctx.fillStyle = 'rgba(220,200,240,0.75)';
    ctx.font = '13px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.emoji} ${item.name}`, barLX - 12, y + 26);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(barLX + 5, y, maxW, barH, 6);
    ctx.fill();

    ctx.fillStyle = barColors[i];
    ctx.beginPath();
    ctx.roundRect(barLX + 5, y, w, barH, 6);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.score}/10`, barLX + w + 12, y + 26);
  });

  // 底部说明 + 二维码
  const botY = barStartY + 5 * (barH + barGap) + 20;
  ctx.fillStyle = 'rgba(200,180,220,0.35)';
  ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('基于大五人格模型 OCEAN · 这不是标签，是你与世界互动方式的一张快照', C, botY);

  const qrSize = 70, qrX = W - qrSize - 22, qrY = H - qrSize - 20;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8);
  ctx.fill();
  try {
    const qrDataUrl = await QRCode.toDataURL('https://inner-theater.github.io/1/', { width: qrSize, margin: 1 });
    const qrImg = await new Promise((resolve, reject) => {
      const qri = new Image();
      qri.onload = () => resolve(qri);
      qri.onerror = reject;
      qri.src = qrDataUrl;
    });
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch { /* ignore */ }

  return new Promise(resolve => c.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png'));
}

export default function Game6_PersonalityTest() {
  const [step, setStep] = useState('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [scores, setScores] = useState(null);
  const [cardUrl, setCardUrl] = useState(null);
  const { profile } = useAuth();

  const handleAnswer = (score) => {
    const newAnswers = { ...answers, [questions[currentQ].id]: score };
    setAnswers(newAnswers);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      calculateAndAnalyze(newAnswers);
    }
  };

  const calculateAndAnalyze = async (allAnswers) => {
    setStep('analyzing');
    setLoading(true);

    // 计算各维度得分
    const dimScores = {};
    Object.keys(DIM_LABELS).forEach(d => { dimScores[d] = []; });
    questions.forEach(q => {
      const raw = allAnswers[q.id] || 3;
      const score = q.reverse ? 6 - raw : raw;
      dimScores[q.dim].push(score);
    });
    const finalScores = {};
    Object.entries(dimScores).forEach(([dim, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      finalScores[dim] = Math.round(avg * 2) / 2;
    });
    setScores(finalScores);

    // 调用 AI 分析
    const ai = await getPersonalityAnalysis(finalScores, {
      nickname: profile?.nickname || '',
      gender: profile?.gender || '',
      avatarLabel: profile?.avatar ? getAvatarConfigById(profile.avatar)?.label || '' : '',
    });

    const result = ai || fallbackAnalysis(finalScores);
    setAnalysis(result);

    // 生成人格卡片
    const card = await generateCard(finalScores, profile, profile?.nickname || '');
    setCardUrl(card);

    setLoading(false);
    setStep('result');

    // 保存到日记
    storage.addDiaryEntry({
      game: '人格测试',
      scores: finalScores,
      analysis: result,
    });
  };

  const handleShare = async () => {
    if (!cardUrl) return;
    const blob = await fetch(cardUrl).then(r => r.blob());
    const file = new File([blob], '内心剧场_人格卡片.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: '我的人格卡片' }); } catch {}
    } else if (navigator.share) {
      try { await navigator.share({ title: '内心剧场', text: '来看看我的人格画像', url: 'https://inner-theater.github.io/1/' }); } catch {}
    }
  };

  const handleDownload = () => {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = '内心剧场_人格卡片.png';
    a.click();
  };

  const handleRestart = () => {
    setStep('intro');
    setCurrentQ(0);
    setQuestions([]);
    setAnswers({});
    setAnalysis(null);
    setScores(null);
    setCardUrl(null);
  };

  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      {step === 'intro' && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🧬</div>
          <h1 style={{ fontSize: 28, color: '#e8d8c0', marginBottom: 8, fontWeight: 700 }}>人格测试</h1>
          <p style={{ color: 'rgba(230,210,170,0.5)', fontSize: 14, marginBottom: 32, lineHeight: 1.8 }}>
            基于大五人格模型(OCEAN)<br />
            30道题 · 约4分钟 · 每次随机抽题 · 生成专属人格画像卡片
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '20px 24px',
            marginBottom: 32, border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'left', lineHeight: 1.8,
          }}>
            <p style={{ color: 'rgba(230,210,170,0.6)', fontSize: 13, margin: 0 }}>
              🎨 <strong style={{ color: '#c084fc' }}>开放性</strong> — 对新事物的好奇与接纳<br />
              📋 <strong style={{ color: '#a78bfa' }}>尽责性</strong> — 自律、条理与目标感<br />
              🎤 <strong style={{ color: '#818cf8' }}>外向性</strong> — 从社交中获取能量的程度<br />
              🤝 <strong style={{ color: '#7dd3fc' }}>宜人性</strong> — 对他人友善与合作的程度<br />
              🧘 <strong style={{ color: '#67e8f9' }}>情绪稳定性</strong> — 情绪的波动与抗压能力
            </p>
          </div>

          <button onClick={() => { setQuestions(getRandomQuestions()); setStep('questions'); }} style={{
            padding: '14px 48px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 6px 25px rgba(124,58,237,0.3)',
          }}>开始测试</button>
        </div>
      )}

      {step === 'questions' && (
        <div>
          {/* 进度条 */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 40 }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 2 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginBottom: 24 }}>
            第 {currentQ + 1} / {questions.length} 题
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <h3 style={{ color: '#e8d8c0', fontSize: 18, marginBottom: 28, lineHeight: 1.6, fontWeight: 500, textAlign: 'center' }}>
                {questions[currentQ].text}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
                {[
                  { score: 1, label: '非常不同意' },
                  { score: 2, label: '不太同意' },
                  { score: 3, label: '中立' },
                  { score: 4, label: '比较同意' },
                  { score: 5, label: '非常同意' },
                ].map(({ score, label }) => (
                  <motion.button
                    key={score}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswer(score)}
                    style={{
                      padding: '14px 8px',
                      minWidth: '60px',
                      maxWidth: '80px',
                      height: '90px',
                      margin: '0 4px',
                      borderRadius: 12,
                      border: `1px solid ${score <= 2 ? 'rgba(129,140,248,0.2)' : score === 3 ? 'rgba(125,211,252,0.2)' : 'rgba(192,132,252,0.25)'}`,
                      background: 'rgba(255,255,255,0.02)',
                      color: 'rgba(230,210,170,0.8)',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{score}</span>
                    <span style={{ fontSize: 10, lineHeight: 1.3 }}>{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {step === 'analyzing' && (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            style={{ fontSize: 48, marginBottom: 20 }}
          >🧬</motion.div>
          <p style={{ color: 'rgba(230,210,170,0.5)', fontSize: 15 }}>正在生成你的人格画像...</p>
        </div>
      )}

      {step === 'result' && analysis && (
        <div>
          {/* 人格卡片预览 */}
          {cardUrl && (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img src={cardUrl} alt="人格卡片" style={{
                width: '100%', maxWidth: 320, borderRadius: 16,
                boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 40px rgba(120,70,170,0.15)',
              }} />
            </div>
          )}

          {/* 分享按钮 */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            <button onClick={handleDownload} style={{
              padding: '11px 28px', borderRadius: 10, border: '1px solid rgba(167,139,250,0.3)',
              background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>下载卡片</button>
            <button onClick={handleShare} style={{
              padding: '11px 28px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(124,58,237,0.3)',
            }}>分享</button>
          </div>

          {/* AI 分析文本 */}
          <div style={{
            padding: '20px', borderRadius: 12,
            background: 'rgba(26,10,46,0.7)', border: '1px solid rgba(124,58,237,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🧠</span>
              <span style={{ fontSize: 13, color: '#a78bfa', letterSpacing: '2px' }}>人格解读</span>
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.9,
              whiteSpace: 'pre-wrap', margin: 0,
            }}>{analysis}</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={handleRestart} style={{
              padding: '10px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: 'rgba(230,210,170,0.4)', fontSize: 13, cursor: 'pointer',
            }}>重新测试</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
