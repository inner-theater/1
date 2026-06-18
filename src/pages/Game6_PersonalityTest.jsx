import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarConfigById } from '../utils/profile';

// 大五人格 (OCEAN) 测试题目
const QUESTIONS = [
  // 开放性 Openness (1-5)
  { id: 1, dim: 'openness', text: '我对艺术、音乐或文学有浓厚的兴趣', reverse: false },
  { id: 2, dim: 'openness', text: '我喜欢尝试新事物，哪怕有些冒险', reverse: false },
  { id: 3, dim: 'openness', text: '我经常沉浸在自己的想象和思考中', reverse: false },
  { id: 4, dim: 'openness', text: '我更喜欢熟悉和常规的事物', reverse: true },
  { id: 5, dim: 'openness', text: '我对抽象的理论和哲学问题感兴趣', reverse: false },
  // 尽责性 Conscientiousness (6-10)
  { id: 6, dim: 'conscientiousness', text: '我会把东西整理得井井有条', reverse: false },
  { id: 7, dim: 'conscientiousness', text: '我做事总是有始有终，不会半途而废', reverse: false },
  { id: 8, dim: 'conscientiousness', text: '我喜欢提前规划而不是临时抱佛脚', reverse: false },
  { id: 9, dim: 'conscientiousness', text: '有时候我做事比较随性，不按计划来', reverse: true },
  { id: 10, dim: 'conscientiousness', text: '答应别人的事我一定会做到', reverse: false },
  // 外向性 Extraversion (11-15)
  { id: 11, dim: 'extraversion', text: '我更喜欢独处而不是参加社交活动', reverse: true },
  { id: 12, dim: 'extraversion', text: '在人群中我通常是活跃气氛的那个人', reverse: false },
  { id: 13, dim: 'extraversion', text: '认识新朋友让我感到兴奋', reverse: false },
  { id: 14, dim: 'extraversion', text: '我喜欢安静的环境胜过热闹的场合', reverse: true },
  { id: 15, dim: 'extraversion', text: '跟人聊天让我充满能量', reverse: false },
  // 宜人性 Agreeableness (16-20)
  { id: 16, dim: 'agreeableness', text: '看到别人遇到困难，我会主动帮忙', reverse: false },
  { id: 17, dim: 'agreeableness', text: '我很少跟人发生争执，宁可自己退一步', reverse: false },
  { id: 18, dim: 'agreeableness', text: '我相信大多数人都是善良的', reverse: false },
  { id: 19, dim: 'agreeableness', text: '有时候我觉得自己把别人的需求放在了前面', reverse: false },
  { id: 20, dim: 'agreeableness', text: '即使不喜欢一个人，我也会保持礼貌', reverse: false },
  // 情绪稳定性 Neuroticism (21-25)
  { id: 21, dim: 'neuroticism', text: '我常常感到紧张或焦虑', reverse: false },
  { id: 22, dim: 'neuroticism', text: '一点小事就能影响我的心情', reverse: false },
  { id: 23, dim: 'neuroticism', text: '大多数时候我对自己的生活感到满意', reverse: true },
  { id: 24, dim: 'neuroticism', text: '在压力下我依然能保持冷静', reverse: true },
  { id: 25, dim: 'neuroticism', text: '我很少为过去的事情后悔或纠结', reverse: true },
];

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

  const top = sorted[0], second = sorted[1], bottom = sorted[4];
  const typeName = getPersonalityType(sorted);

  let a = `${typeName}\n\n`;
  a += `在你的五维人格画像中，${top.emoji}「${top.name}」最为突出——${top.score}/10。这意味着${getDimDeepDesc(top.dim, top.score)}\n\n`;
  a += `紧随其后的是${second.emoji}「${second.name}」（${second.score}/10）。${getDimDeepDesc(second.dim, second.score)}\n\n`;
  a += `相对低调的是${bottom.emoji}「${bottom.name}」（${bottom.score}/10）。${getLowDesc(bottom.dim, bottom.score)}\n\n`;

  // 综合描述
  const combo = `${top.dim}_${second.dim}`;
  if (combo === 'openness_extraversion' || combo === 'extraversion_openness') {
    a += '你像一阵自由的风——对世界充满好奇，也不怕被人看到。创作、旅行、与人碰撞出新想法，这些是你最自然的呼吸方式。但偶尔也需要港湾：一个能让你停下来消化这一切的人或地方。';
  } else if (combo.includes('conscientiousness') && combo.includes('agreeableness')) {
    a += '你是那种让人安心的存在——靠谱、有规划、也为别人着想。团队里你可能是最早到最晚走的那个人。但要记得，对自己好一点：你不是超人，偶尔也可以让别人来照顾你。';
  } else if (combo.includes('openness') && combo.includes('neuroticism')) {
    a += '你的内心世界丰富得像一座美术馆——但有些展厅你不太敢自己进去。敏感是一把双刃剑：它让你看到别人忽略的美，也让你感受到别人不在意的痛。创作可能是你最好的出口。';
  } else {
    a += '你的人格画像有一个独特之处——看似矛盾的两种特质在你身上和谐共存。这本身就是一种礼物：你能理解两边的人，能从不同角度看世界。别急着给自己贴标签，模糊地带往往是最精彩的部分。';
  }

  a += `\n\n${top.emoji}${top.name} ${top.score}/10 · ${sorted[1].emoji}${sorted[1].name} ${sorted[1].score}/10 · ${sorted[2].emoji}${sorted[2].name} ${sorted[2].score}/10 · ${sorted[3].emoji}${sorted[3].name} ${sorted[3].score}/10 · ${bottom.emoji}${bottom.name} ${bottom.score}/10`;
  return a;
}

function getPersonalityType(sorted) {
  const top = sorted[0], second = sorted[1];
  const types = {
    openness_extraversion: '🌍 探索者型',
    openness_agreeableness: '🎨 人文创意型',
    openness_conscientiousness: '🏗️ 理想实践型',
    conscientiousness_extraversion: '🚀 高效领袖型',
    conscientiousness_agreeableness: '🛡️ 可靠守护型',
    conscientiousness_neuroticism: '🧠 完美主义型',
    extraversion_agreeableness: '🎉 社交温暖型',
    extraversion_neuroticism: '⚡ 感性表达型',
    agreeableness_neuroticism: '💧 共情敏感型',
    openness_neuroticism: '🌙 敏感创造型',
  };
  const key = `${top.dim}_${second.dim}`;
  return types[key] || types[`${second.dim}_${top.dim}`] || '✨ 独特人格型';
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
  return `这是一个中等偏低的得分——你在这方面的特质相对内敛，但不会影响你的整体人格。`;
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
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [scores, setScores] = useState(null);
  const [cardUrl, setCardUrl] = useState(null);
  const { profile } = useAuth();

  const handleAnswer = (score) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQ].id]: score };
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
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
    QUESTIONS.forEach(q => {
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
    setAnswers({});
    setAnalysis(null);
    setScores(null);
    setCardUrl(null);
  };

  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      {step === 'intro' && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🧬</div>
          <h1 style={{ fontSize: 28, color: '#e8d8c0', marginBottom: 8, fontWeight: 700 }}>人格测试</h1>
          <p style={{ color: 'rgba(230,210,170,0.5)', fontSize: 14, marginBottom: 32, lineHeight: 1.8 }}>
            基于大五人格模型(OCEAN)<br />
            25道题 · 约3分钟 · 生成专属人格画像卡片
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

          <button onClick={() => setStep('questions')} style={{
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
            第 {currentQ + 1} / {QUESTIONS.length} 题
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
                {QUESTIONS[currentQ].text}
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
