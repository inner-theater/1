import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import storage from '../utils/storage';
import InsightPanel from '../components/InsightPanel';
import { generateQuestions } from '../utils/ai-insight';
// 生成复古剧场风分享海报
async function generatePoster(shareUrl, question, questionCount) {
  const canvas = document.createElement('canvas');
  canvas.width = 750;
  canvas.height = 1334;
  const ctx = canvas.getContext('2d');

  // 深紫背景
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0d0520');
  bgGrad.addColorStop(0.4, '#1a0a2e');
  bgGrad.addColorStop(0.7, '#2d1b4e');
  bgGrad.addColorStop(1, '#0d0520');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 顶部剧场幕布
  ctx.save();
  const curtainGrad = ctx.createLinearGradient(0, 0, 0, 280);
  curtainGrad.addColorStop(0, '#8b0000');
  curtainGrad.addColorStop(0.5, '#5c0a0a');
  curtainGrad.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = curtainGrad;
  // 左侧幕布
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(340, 0);
  for (let i = 0; i < 12; i++) {
    const x = 340 * (i / 12);
    const y = 240 + Math.sin(i * 0.8) * 40;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(0, 280);
  ctx.closePath();
  ctx.fill();
  // 右侧幕布
  ctx.beginPath();
  ctx.moveTo(750, 0);
  ctx.lineTo(410, 0);
  for (let i = 12; i >= 0; i--) {
    const x = 410 + (340 * i / 12);
    const y = 240 + Math.sin(i * 0.8) * 40;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(750, 280);
  ctx.closePath();
  ctx.fill();
  // 幕布金穗
  ctx.fillStyle = '#c9a84c';
  for (let i = 0; i < 30; i++) {
    const x = 50 + i * 22;
    const h = 12 + Math.sin(i * 0.5) * 6;
    ctx.beginPath();
    ctx.ellipse(x, 275, 8, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 装饰金边
  ctx.strokeStyle = 'rgba(201,168,76,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
  ctx.strokeStyle = 'rgba(201,168,76,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

  // 内框装饰
  ctx.strokeStyle = 'rgba(201,168,76,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(80, 350, canvas.width - 160, canvas.height - 500, 20);
  ctx.stroke();

  // 标题区背景光晕
  ctx.save();
  const glowGrad = ctx.createRadialGradient(375, 420, 20, 375, 420, 300);
  glowGrad.addColorStop(0, 'rgba(168,85,247,0.15)');
  glowGrad.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(100, 350, 550, 300);
  ctx.restore();

  // 剧场聚光灯效果
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const lx = 250 + i * 125;
    const spotGrad = ctx.createLinearGradient(0, 0, 0, 200);
    spotGrad.addColorStop(0, 'rgba(255,255,200,0.04)');
    spotGrad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 80, 300);
    ctx.lineTo(lx - 2, 500);
    ctx.lineTo(lx + 2, 500);
    ctx.lineTo(lx + 80, 300);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 标题
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 44px "Noto Serif SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText('朋友灵魂拷问室', 375, 420);

  // 副标题
  ctx.fillStyle = 'rgba(232,212,139,0.5)';
  ctx.font = '16px "Noto Serif SC", serif';
  ctx.fillText('一场以朋友之名的内心对话', 375, 460);

  // 分隔线
  ctx.strokeStyle = 'rgba(201,168,76,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 490);
  ctx.lineTo(550, 490);
  ctx.stroke();

  // 用户问题区
  const maxLineWidth = 500;
  ctx.fillStyle = '#f5e6d3';
  ctx.font = '18px "Noto Serif SC", sans-serif';
  const qLines = wrapText(ctx, `「${question}」`, maxLineWidth);
  let qY = 540;
  qLines.forEach((line) => {
    ctx.fillText(line, 375, qY);
    qY += 32;
  });

  // 描述文字
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '15px sans-serif';
  ctx.fillText(`邀请你来回答 ${questionCount} 道灵魂拷问`, 375, qY + 24);
  ctx.fillText('借你的视角，照见我没看见的自己', 375, qY + 52);

  // 装饰花纹 - 左侧
  drawOrnament(ctx, 160, qY + 100, 'left');
  // 右侧
  drawOrnament(ctx, 590, qY + 100, 'right');

  // QR 码区域
  const qrSize = 200;
  const qrX = 375 - qrSize / 2;
  const qrY = qY + 130;

  // 生成 QR 码（data URL）
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: qrSize,
    margin: 2,
    color: { dark: '#1a0a2e', light: '#f5e6d3' },
  });

  // QR 背景卡片
  ctx.fillStyle = 'rgba(245,230,211,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 16);
  ctx.fill();

  // 绘制 QR 码
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 扫码提示
  ctx.fillStyle = '#333';
  ctx.font = '14px sans-serif';
  ctx.fillText('扫码帮我回答', 375, qrY + qrSize + 36);

  // 底部品牌区
  const footerY = canvas.height - 120;
  ctx.strokeStyle = 'rgba(201,168,76,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, footerY);
  ctx.lineTo(600, footerY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(232,212,139,0.6)';
  ctx.font = '18px "Noto Serif SC", serif';
  ctx.fillText('内心剧场 · 你的秘密决策练习场', 375, footerY + 40);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '12px sans-serif';
  ctx.fillText('扫码或分享链接，邀请朋友走进你的内心剧场', 375, footerY + 68);

  return canvas.toDataURL('image/png');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let current = '';
  for (const ch of text) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawOrnament(ctx, x, y, side) {
  ctx.save();
  ctx.strokeStyle = 'rgba(201,168,76,0.35)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(201,168,76,0.1)';

  // 菱形花纹
  ctx.beginPath();
  const dir = side === 'left' ? -1 : 1;
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x + dir * 20, y);
  ctx.lineTo(x, y + 16);
  ctx.lineTo(x - dir * 20, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 两侧小点
  ctx.fillStyle = 'rgba(201,168,76,0.4)';
  ctx.beginPath();
  ctx.arc(x + dir * 35, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - dir * 35, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function Game3_FriendRoom() {
  const [step, setStep] = useState('input');
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultCard, setResultCard] = useState(null);
  const [posterUrl, setPosterUrl] = useState(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [friendAnswers, setFriendAnswers] = useState([]);
  const [shareCode, setShareCode] = useState('');

  const generateAIQuestions = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const currentQ = question.trim();
    try {
      const qs = await generateQuestions(currentQ);
      if (qs && qs.length >= 5) {
        const formatted = qs.slice(0, 10).map((q, i) => ({
          ...q,
          id: i,
          options: Array.isArray(q.options) ? q.options.map((o, j) => ({
            label: String.fromCharCode(65 + j), text: o.replace(/^[A-D][.、]\s*/, ''),
          })) : [],
        }));
        setQuestions(formatted);
        // 预创建分享链接
        const code = storage.createShareLink('friend-room', { question: currentQ, questions: formatted });
        setShareUrl(`https://inner-theater.github.io/1/#/answer/${code}`);
        setShareCode(code);
        setStep('sharing');
      } else {
        const fallbackQs = getDefaultQuestions(currentQ);
        setQuestions(fallbackQs);
        const code = storage.createShareLink('friend-room', { question: currentQ, questions: fallbackQs });
        setShareUrl(`https://inner-theater.github.io/1/#/answer/${code}`);
        setStep('sharing');
      }
    } catch {
      const fallbackQs = getDefaultQuestions(currentQ);
      setQuestions(fallbackQs);
      const code = storage.createShareLink('friend-room', { question: currentQ, questions: fallbackQs });
      setShareUrl(`https://inner-theater.github.io/1/#/answer/${code}`);
      setStep('sharing');
    }
    setLoading(false);
  };

  const handleGeneratePoster = async () => {
    if (generatingPoster) return;
    setGeneratingPoster(true);
    try {
      const url = await generatePoster(shareUrl, question, questions.length);
      setPosterUrl(url);
    } catch {
      // fallback: just copy link
    }
    setGeneratingPoster(false);
  };

  const handleAnswer = (qId, option) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const submitAnswers = () => {
    if (hasDrawnCard) return;
    setHasDrawnCard(true);
    const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    setResultCard(card);
    setShowResult(true);

    // Load friend answers
    const fAnswers = storage.get(`friend_answers_${shareCode}`) || [];
    setFriendAnswers(fAnswers);

    storage.addDiaryEntry({
      game: '朋友灵魂拷问室',
      question: question,
      result: `得到塔罗牌「${card.name} ${card.emoji}」——${card.meaning}${fAnswers.length > 0 ? `（已有${fAnswers.length}位朋友回答）` : ''}`,
      type: 'friend-room',
    });
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>🔮</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            朋友灵魂拷问室
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            让朋友的视角，照见你没发现的自己
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ background: 'rgba(35,20,56,0.8)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(201,168,76,0.2)' }}>
              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '12px', display: 'block' }}>
                写下你的烦恼，生成专属灵魂拷问
              </label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="比如：我该不该接受这份外地的工作offer？" rows={4}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', outline: 'none', resize: 'vertical', marginBottom: '20px' }} />
              <button onClick={generateAIQuestions} disabled={!question.trim() || loading}
                style={{ width: '100%', padding: '16px', borderRadius: '12px',
                  background: question.trim() ? 'linear-gradient(135deg, #c9a84c, #e8d48b)' : 'rgba(255,255,255,0.1)',
                  color: question.trim() ? '#1a0a2e' : 'rgba(255,255,255,0.3)',
                  fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', border: 'none',
                  cursor: question.trim() ? 'pointer' : 'not-allowed' }}>
                {loading ? 'AI 正在生成个性化题目...' : '生成灵魂拷问题目'}
              </button>
            </motion.div>
          )}

          {step === 'sharing' && (
            <motion.div key="sharing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* 分享预览卡片 */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(26,10,46,0.95) 0%, rgba(45,27,78,0.9) 50%, rgba(26,10,46,0.95) 100%)',
                borderRadius: '20px', padding: '32px', border: '2px solid rgba(201,168,76,0.25)',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
              }}>
                {/* 装饰花纹 */}
                <div style={{ position: 'absolute', top: 8, left: 16, color: 'rgba(201,168,76,0.15)', fontSize: '24px' }}>✦</div>
                <div style={{ position: 'absolute', top: 8, right: 16, color: 'rgba(201,168,76,0.15)', fontSize: '24px' }}>✦</div>
                <div style={{ position: 'absolute', bottom: 8, left: 16, color: 'rgba(201,168,76,0.15)', fontSize: '24px' }}>✦</div>
                <div style={{ position: 'absolute', bottom: 8, right: 16, color: 'rgba(201,168,76,0.15)', fontSize: '24px' }}>✦</div>

                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔮</div>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '3px', marginBottom: '16px' }}>
                  朋友灵魂拷问室
                </h3>

                {/* 问题预览 */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '20px', marginBottom: '20px',
                  border: '1px solid rgba(201,168,76,0.15)',
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>
                    你的烦恼
                  </p>
                  <p style={{ color: '#f5e6d3', fontSize: '16px', lineHeight: 1.6, fontStyle: 'italic' }}>
                    「{question}」
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '12px' }}>
                    已为你准备了 <strong style={{ color: '#e8d48b' }}>{questions.length}</strong> 道灵魂拷问
                  </p>
                </div>

                {/* 分享按钮 */}
                <button onClick={handleGeneratePoster} disabled={generatingPoster}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '12px',
                    background: generatingPoster ? 'rgba(168,85,247,0.2)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    color: '#fff', fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px',
                    border: 'none', cursor: generatingPoster ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                  <span>{generatingPoster ? '⏳ 正在生成海报...' : '📤 分享给朋友'}</span>
                </button>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '12px' }}>
                  生成一张复古剧场风海报，朋友扫码即可作答
                </p>
              </div>

              {/* 海报预览弹窗 */}
              <AnimatePresence>
                {posterUrl && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setPosterUrl(null)}
                    style={{
                      position: 'fixed', inset: 0, zIndex: 9999,
                      background: 'rgba(0,0,0,0.85)', display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '20px',
                    }}>
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ maxWidth: '360px', width: '100%', maxHeight: '85vh', overflow: 'auto', borderRadius: '12px' }}>
                      <img src={posterUrl} alt="分享海报" style={{ width: '100%', height: 'auto', borderRadius: '12px' }} />
                    </motion.div>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button onClick={() => {
                        const a = document.createElement('a');
                        a.href = posterUrl;
                        a.download = '朋友灵魂拷问室海报.png';
                        a.click();
                      }}
                        style={{ padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #c9a84c, #e8d48b)', color: '#1a0a2e', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', letterSpacing: '2px' }}>
                        💾 保存海报
                      </button>
                      <button onClick={async () => {
                        try {
                          const blob = await (await fetch(posterUrl)).blob();
                          await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob }),
                          ]);
                          alert('海报已复制到剪贴板，可直接粘贴发送');
                        } catch {
                          await navigator.clipboard.writeText(shareUrl);
                          alert('已复制分享链接');
                        }
                      }}
                        style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', letterSpacing: '2px' }}>
                        📋 复制海报
                      </button>
                      <button onClick={() => setPosterUrl(null)}
                        style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                        关闭
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginTop: '32px' }}>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>
                  你也可以自己先回答试试 ↓
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {questions.map((q, qi) => (
                    <div key={q.id} style={{
                      padding: '20px', borderRadius: '12px',
                      background: 'rgba(35,20,56,0.8)', border: '1px solid rgba(201,168,76,0.2)',
                    }}>
                      <p style={{ color: '#f5e6d3', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                        {qi + 1}. {q.q}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {(q.options || []).map((opt) => (
                          <button key={opt.label} onClick={() => handleAnswer(q.id, opt.label)}
                            style={{
                              padding: '10px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'left',
                              background: answers[q.id] === opt.label ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                              border: answers[q.id] === opt.label ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)',
                              color: answers[q.id] === opt.label ? '#e8d48b' : 'rgba(255,255,255,0.6)',
                              cursor: 'pointer',
                            }}>
                            {opt.label}. {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '12px' }}>
                    已回答 {answeredCount}/{questions.length}
                  </p>
                  <button onClick={submitAnswers} disabled={!allAnswered || hasDrawnCard}
                    style={{ padding: '14px 40px', borderRadius: '12px',
                      background: (allAnswered && !hasDrawnCard) ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.08)',
                      color: (allAnswered && !hasDrawnCard) ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px',
                      border: 'none', cursor: (allAnswered && !hasDrawnCard) ? 'pointer' : 'not-allowed' }}>
                    {hasDrawnCard ? '已抽取塔罗牌' : '抽取你的塔罗牌'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'sharing' && showResult && resultCard && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{ textAlign: 'center', padding: '40px', background: 'rgba(35,20,56,0.9)', borderRadius: '16px', border: '2px solid #a855f7', marginTop: '24px' }}>
              <motion.div animate={{ rotateY: [90, 0] }} transition={{ duration: 0.8 }}
                style={{ fontSize: '80px', marginBottom: '16px' }}>
                {resultCard.emoji}
              </motion.div>
              <h3 style={{ fontSize: '24px', color: '#a855f7', letterSpacing: '3px', marginBottom: '8px' }}>
                {resultCard.name}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', fontStyle: 'italic', marginBottom: '8px' }}>
                {resultCard.meaning}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                这不是预言——是你借朋友的视角看见的自己
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <button onClick={() => { setAnswers({}); setShowResult(false); setHasDrawnCard(false); }}
                  style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', fontSize: '14px', cursor: 'pointer' }}>
                  重新回答
                </button>
                <button onClick={() => { setStep('input'); setQuestions([]); setAnswers({}); setShowResult(false); setHasDrawnCard(false); }}
                  style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px', cursor: 'pointer' }}>
                  换个问题
                </button>
              </div>

              {/* Friend answers */}
              {friendAnswers.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  style={{
                    marginTop: '20px', padding: '16px', borderRadius: '12px',
                    background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)',
                    textAlign: 'left',
                  }}>
                  <p style={{ color: '#60a5fa', fontSize: '13px', letterSpacing: '2px', marginBottom: '12px', textAlign: 'center' }}>
                    👥 朋友们的回答
                  </p>
                  {friendAnswers.map((fa, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: '8px',
                      background: 'rgba(0,0,0,0.2)', marginBottom: '8px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: fa.friendAvatar
                            ? `linear-gradient(135deg, var(--velvet), var(--gold-dark))`
                            : 'linear-gradient(135deg, #6B7280, #9CA3AF)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', flexShrink: 0,
                        }}>
                          👤
                        </span>
                        <span style={{ color: '#e8d48b', fontSize: '13px', fontWeight: 'bold' }}>
                          {fa.friendDisplay}
                        </span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: 1.5 }}>
                        {fa.answerSummary?.slice(0, 120)}{(fa.answerSummary || '').length > 120 ? '...' : ''}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}

              <InsightPanel
                gameType="friend-room"
                visible={true}
                context={{
                  question,
                  answers: questions.map((q, i) => ({
                    no: i + 1,
                    q: q.q,
                    selected: answers[q.id] ? (q.options || []).find(o => o.label === answers[q.id])?.text || answers[q.id] : '未作答',
                  })),
                  tarotCard: resultCard ? `${resultCard.name} ${resultCard.emoji}——${resultCard.meaning}` : '',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const TAROT_CARDS = [
  { name: 'The Star', emoji: '⭐', meaning: '希望与灵感在指引你' },
  { name: 'The Sun', emoji: '☀️', meaning: '光明和快乐即将到来' },
  { name: 'The Moon', emoji: '🌙', meaning: '直觉比理性更清楚方向' },
  { name: 'The Lovers', emoji: '💞', meaning: '忠于内心的选择就是最好的选择' },
  { name: 'Strength', emoji: '🦁', meaning: '你有超出自己想象的力量' },
  { name: 'The Chariot', emoji: '🐎', meaning: '果断前进，犹豫才是一切阻碍' },
  { name: 'The Hermit', emoji: '🏔️', meaning: '独处中能找到最真实的答案' },
  { name: 'Wheel of Fortune', emoji: '🎡', meaning: '好运正在向你转来' },
  { name: 'Justice', emoji: '⚖️', meaning: '公平的判断力在保护你' },
  { name: 'Temperance', emoji: '🌊', meaning: '平衡和耐心会带来回报' },
];

function getDefaultQuestions(dilemma) {
  return [
    { id: 0, q: '如果你最好的朋友和你面临一模一样的处境，你会给他什么建议？', options: [
      { label: 'A', text: '果断选一条路，别纠结' }, { label: 'B', text: '再等等，看情况' }, { label: 'C', text: '让直觉做决定' }, { label: 'D', text: '列个清单比一比' },
    ]},
    { id: 1, q: `面对「${dilemma.slice(0, 10)}...」这个选择，你最怕的是什么？`, options: [
      { label: 'A', text: '选了之后后悔' }, { label: 'B', text: '错过另一个机会' }, { label: 'C', text: '让在乎的人失望' }, { label: 'D', text: '发现自己其实根本不清楚想要什么' },
    ]},
    { id: 2, q: '如果你现在已经有答案了，你的身体有什么感觉？', options: [
      { label: 'A', text: '心跳加速，很兴奋' }, { label: 'B', text: '胃有点紧，很紧张' }, { label: 'C', text: '没什么特别的感觉' }, { label: 'D', text: '松了口气' },
    ]},
    { id: 3, q: '你觉得五年后的自己回头看这个决定，会说什么？', options: [
      { label: 'A', text: '干得好，当时就该这么选' }, { label: 'B', text: '没事的，选什么都会成长' }, { label: 'C', text: '那件事其实没那么重要' }, { label: 'D', text: '谢谢你当时认真想了' },
    ]},
    { id: 4, q: '在你纠结的这段时间，有没有一个人让你特别想听听他/她的意见？', options: [
      { label: 'A', text: '有，而且我知道他/她会说什么' }, { label: 'B', text: '有，但不敢问' }, { label: 'C', text: '没有特别想找的人' }, { label: 'D', text: '我只想听自己的' },
    ]},
    { id: 5, q: '如果这个选择是一道菜，你觉得它是什么味道？', options: [
      { label: 'A', text: '酸甜的，有期待也有不安' }, { label: 'B', text: '辣的，很有挑战性' }, { label: 'C', text: '淡淡的，顺其自然' }, { label: 'D', text: '苦的，但知道有回甘' },
    ]},
    { id: 6, q: '用一句话说服现在的你——你会说什么？', options: [
      { label: 'A', text: '不做会后悔' }, { label: 'B', text: '你已经准备好了' }, { label: 'C', text: '不管选什么，你都能应对' }, { label: 'D', text: '别想太多，去就对了' },
    ]},
    { id: 7, q: '你最后一次因为什么事情笑到停不下来？', options: [
      { label: 'A', text: '朋友说了个笑话' }, { label: 'B', text: '看了一部好电影' }, { label: 'C', text: '自己干了件傻事' }, { label: 'D', text: '记不清了' },
    ]},
    { id: 8, q: '如果做完选择后可以吃一顿庆祝饭，你想吃什么？', options: [
      { label: 'A', text: '火锅，热热闹闹的' }, { label: 'B', text: '日料，精致安静的' }, { label: 'C', text: '自己做的，踏实的' }, { label: 'D', text: '无所谓，吃什么都行' },
    ]},
    { id: 9, q: '闭上眼睛三秒，你第一个看到的画面是什么？', options: [
      { label: 'A', text: '一片开阔的风景' }, { label: 'B', text: '熟悉的家或街道' }, { label: 'C', text: '一个模糊的背影' }, { label: 'D', text: '一片空白' },
    ]},
  ];
}
