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

  const top = sorted[0];
  const bottom = sorted[4];
  const topLabel = top.score >= 8 ? '非常' : '比较';

  let analysis = `根据大五人格模型（OCEAN），你的性格画像中最突出的是${top.emoji}「${top.name}」（得分 ${top.score}/10），属于${topLabel}高的水平。${top.desc}——这在你身上体现得尤为明显。\n\n`;

  analysis += `而得分最低的是${bottom.emoji}「${bottom.name}」（${bottom.score}/10）。`;

  if (bottom.dim === 'extraversion' && bottom.score <= 4) {
    analysis += '你更享受独处的深度，热闹对你来说是消耗而不是充电。这完全没问题——内向者的能量来源是向内探索，而不是向外索取。';
  } else if (bottom.dim === 'neuroticism' && bottom.score <= 4) {
    analysis += '你的情绪非常稳定，像一棵扎根很深的树，风吹得动枝叶但动不了根。这是非常难得的心理素质。';
  } else if (bottom.dim === 'openness' && bottom.score <= 4) {
    analysis += '你偏爱熟悉和稳定的环境，不喜欢无谓的变化。但可预测的世界也有它的深度——就像反复读一本好书，每次都能发现新的层次。';
  } else if (bottom.dim === 'agreeableness' && bottom.score <= 4) {
    analysis += '你有自己的边界，不轻易妥协。这在需要保护自己能量的时候是极其重要的能力。';
  } else if (bottom.dim === 'conscientiousness' && bottom.score <= 4) {
    analysis += '你更随性自由，不喜欢被条条框框束缚。创造力往往在不按计划来的瞬间迸发。';
  }

  analysis += `\n\n${top.emoji} ${top.name}（${top.score}分）| ${sorted[1].emoji} ${sorted[1].name}（${sorted[1].score}分）| ${sorted[2].emoji} ${sorted[2].name}（${sorted[2].score}分）| ${sorted[3].emoji} ${sorted[3].name}（${sorted[3].score}分）| ${bottom.emoji} ${bottom.name}（${bottom.score}分）`;
  analysis += '\n\n记住一点：人格不是固定不变的标签，它是你与世界互动方式的快照。今天的你，就是最真实的版本。';

  return analysis;
}

// Canvas 人格卡片
async function generateCard(scores, profile, nickname) {
  const W = 750, H = 1200;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // 深色渐变背景
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0d0815');
  bgGrad.addColorStop(0.5, '#120a1e');
  bgGrad.addColorStop(1, '#0a0510');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 顶部光晕
  const glow = ctx.createRadialGradient(W / 2, 280, 30, W / 2, 280, 500);
  glow.addColorStop(0, 'rgba(120, 70, 170, 0.12)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 顶部装饰线
  ctx.strokeStyle = 'rgba(180,140,220,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 60);
  ctx.lineTo(W - 80, 60);
  ctx.stroke();

  // 用户头像和名字
  const avatarCfg = profile?.avatar ? getAvatarConfigById(profile.avatar) : null;
  const avatarGrad = ctx.createLinearGradient(W / 2 - 35, 85, W / 2 + 35, 155);
  avatarGrad.addColorStop(0, avatarCfg?.bg?.[0] || '#6b4fa0');
  avatarGrad.addColorStop(1, avatarCfg?.bg?.[1] || '#9b7fd4');
  ctx.fillStyle = avatarGrad;
  ctx.beginPath();
  ctx.arc(W / 2, 120, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '26px serif';
  ctx.textAlign = 'center';
  ctx.fillText(avatarCfg?.emoji || '👤', W / 2, 130);

  const displayName = nickname || '';
  ctx.fillStyle = 'rgba(230,210,240,0.9)';
  ctx.font = 'bold 20px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(displayName || '我', W / 2, 180);

  ctx.fillStyle = 'rgba(200,180,220,0.5)';
  ctx.font = '13px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('内心剧场 · 人格测试', W / 2, 205);

  // 维度条形图
  const sorted = Object.entries(scores)
    .map(([k, v]) => ({ dim: k, score: v, ...DIM_LABELS[k] }))
    .sort((a, b) => b.score - a.score);

  const barStartY = 245;
  const barH = 56;
  const barGap = 15;
  const barLeftX = 120;

  sorted.forEach((item, i) => {
    const y = barStartY + i * (barH + barGap);
    const maxBarW = W - barLeftX - 80;
    const barW = (item.score / 10) * maxBarW;

    // 标签
    ctx.fillStyle = 'rgba(220,200,240,0.85)';
    ctx.font = '15px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.emoji} ${item.name}`, barLeftX - 15, y + 28);

    // 底条
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(barLeftX + 10, y, maxBarW, barH, 8);
    ctx.fill();

    // 得分条
    const barColors = ['#c084fc', '#a78bfa', '#818cf8', '#7dd3fc', '#67e8f9'];
    ctx.fillStyle = barColors[i % 5];
    ctx.beginPath();
    ctx.roundRect(barLeftX + 10, y, barW, barH, 8);
    ctx.fill();

    // 分值
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.score}/10`, barLeftX + barW + 15, y + 32);
  });

  // 底部说明
  const bottomY = barStartY + sorted.length * (barH + barGap) + 40;
  ctx.fillStyle = 'rgba(200,180,220,0.4)';
  ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('基于大五人格模型 (OCEAN)', W / 2, bottomY);
  ctx.fillText('这不是标签，是你与世界互动方式的一张快照', W / 2, bottomY + 22);

  // 二维码
  const qrSize = 76;
  const qrX = W - qrSize - 24;
  const qrY = H - qrSize - 24;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8);
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
