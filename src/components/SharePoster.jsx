import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

const SITE_URL = 'https://inner-theater.github.io/1/';

const GAMES = [
  { name: '本能之手', icon: '🤲', tag: '直觉', desc: '让光球在5秒内替你抓一个答案' },
  { name: '反向恐惧清单', icon: '🎭', tag: '勇气', desc: '删去恐惧，留下的就是底线' },
  { name: '平行时空来信', icon: '✉️', tag: '未来', desc: 'AI为你写下不同道路的未来之信' },
  { name: '朋友灵魂拷问室', icon: '🔮', tag: '镜映', desc: '借朋友的视角审视自己' },
  { name: '价值天平拍卖会', icon: '⚖️', tag: '理性', desc: '用金币分配你的价值观' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

// Helper: draw a centered rounded rectangle with stroke
function drawCard(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

// Helper: draw decorative diamond
function drawDiamond(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.6, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.6, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

async function generatePoster() {
  const W = 750, H = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ===== 深邃夜空背景 =====
  const bg = ctx.createRadialGradient(W / 2, 300, 50, W / 2, H, H);
  bg.addColorStop(0, '#1a0a30');
  bg.addColorStop(0.4, '#0e0520');
  bg.addColorStop(0.75, '#080315');
  bg.addColorStop(1, '#030110');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ===== 星星点缀 =====
  for (let i = 0; i < 60; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * H;
    const sr = 0.5 + Math.random() * 1.8;
    const so = 0.2 + Math.random() * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${so})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 顶部装饰框 =====
  ctx.strokeStyle = 'rgba(201,168,76,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(35, 35, W - 70, H - 70);
  ctx.strokeStyle = 'rgba(201,168,76,0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, W - 110, H - 110);

  // 四角装饰
  const corners = [[55, 55], [W - 55, 55], [55, H - 55], [W - 55, H - 55]];
  corners.forEach(([cx, cy]) => {
    ctx.strokeStyle = 'rgba(201,168,76,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.stroke();
  });

  // ===== 顶部剧场拱门 =====
  ctx.save();
  const archGrad = ctx.createLinearGradient(0, 0, 0, 340);
  archGrad.addColorStop(0, '#4a0010');
  archGrad.addColorStop(0.35, '#2a0008');
  archGrad.addColorStop(0.7, 'rgba(10,2,30,0.6)');
  archGrad.addColorStop(1, 'rgba(10,2,30,0)');
  ctx.fillStyle = archGrad;

  // Arch shape - wider at center
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 310);
  ctx.quadraticCurveTo(W / 2, 260, W, 310);
  ctx.lineTo(W, 0);
  ctx.closePath();
  ctx.fill();

  // 左侧幕布褶皱
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(60, 160, 0, 280);
  ctx.quadraticCurveTo(120, 200, 0, 170);
  ctx.quadraticCurveTo(80, 120, 0, 80);
  ctx.closePath();
  ctx.fillStyle = 'rgba(80,0,20,0.5)';
  ctx.fill();

  // 右侧幕布褶皱
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.quadraticCurveTo(W - 60, 160, W, 280);
  ctx.quadraticCurveTo(W - 120, 200, W, 170);
  ctx.quadraticCurveTo(W - 80, 120, W, 80);
  ctx.closePath();
  ctx.fillStyle = 'rgba(80,0,20,0.5)';
  ctx.fill();

  // 幕布金穗流苏
  for (let i = 0; i < 35; i++) {
    const x = 40 + i * 20;
    const waveY = 295 + Math.sin(i * 0.6) * 10;
    ctx.strokeStyle = `rgba(201,168,76,${0.15 + Math.sin(i * 0.4) * 0.08})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, waveY);
    ctx.lineTo(x + (Math.random() - 0.5) * 8, waveY + 16 + Math.random() * 12);
    ctx.stroke();
  }
  ctx.restore();

  // ===== 神秘光晕 — 标题背后 =====
  const mysticGlow = ctx.createRadialGradient(W / 2, 370, 30, W / 2, 370, 350);
  mysticGlow.addColorStop(0, 'rgba(180,140,220,0.12)');
  mysticGlow.addColorStop(0.4, 'rgba(100,70,150,0.04)');
  mysticGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mysticGlow;
  ctx.fillRect(W / 2 - 350, 120, 700, 500);

  // ===== 标题 —— 剧院招牌 =====
  ctx.textAlign = 'center';

  // 装饰横线
  const lineGrad1 = ctx.createLinearGradient(W / 2 - 180, 0, W / 2 + 180, 0);
  lineGrad1.addColorStop(0, 'transparent');
  lineGrad1.addColorStop(0.3, 'rgba(201,168,76,0.35)');
  lineGrad1.addColorStop(0.5, 'rgba(232,212,139,0.5)');
  lineGrad1.addColorStop(0.7, 'rgba(201,168,76,0.35)');
  lineGrad1.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad1;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 180, 375);
  ctx.lineTo(W / 2 + 180, 375);
  ctx.stroke();

  // 标题文字
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 58px "Noto Serif SC", "SimSun", serif';
  ctx.fillText('内心剧场', W / 2, 345);

  // 小装饰点
  ctx.fillStyle = 'rgba(232,212,139,0.5)';
  ctx.beginPath();
  ctx.arc(W / 2 - 190, 370, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.arc(W / 2 + 190, 370, 2.5, 0, Math.PI * 2); ctx.fill();

  // 英文
  ctx.fillStyle = 'rgba(232,212,139,0.35)';
  ctx.font = 'italic 15px "Playfair Display", serif';
  ctx.fillText('THE INNER THEATER', W / 2, 395);

  // Slogan
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '16px "Noto Sans SC", sans-serif';
  ctx.fillText('听见你心底的声音', W / 2, 440);

  // 分隔符
  drawDiamond(ctx, W / 2, 475, 6, 'rgba(201,168,76,0.35)');

  // ===== 一句话介绍 =====
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '13px "Noto Sans SC", sans-serif';
  ctx.fillText('5个心理剧场 · 用游戏的方式做决策', W / 2, 510);
  ctx.fillText('不是替你做选择，是帮你听见自己', W / 2, 536);

  // ===== 五大剧场区域 =====
  const sectionTop = 580;
  drawDiamond(ctx, W / 2, sectionTop, 5, 'rgba(201,168,76,0.25)');
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px "Noto Serif SC", serif';
  ctx.fillText('··· 五大剧场 ···', W / 2, sectionTop + 22);

  // 卡片参数 — single column layout, more air
  const cardW = 560, cardH = 52;
  const cardStartY = sectionTop + 55;
  const gapY = 16;
  const cardX = (W - cardW) / 2;

  GAMES.forEach((g, i) => {
    const cy = cardStartY + i * (cardH + gapY);

    // Card bg
    ctx.fillStyle = 'rgba(20,10,40,0.6)';
    ctx.strokeStyle = 'rgba(201,168,76,0.12)';
    ctx.lineWidth = 1;
    drawCard(ctx, cardX, cy, cardW, cardH, 10);

    // Left accent stripe
    ctx.fillStyle = `rgba(201,168,76,0.25)`;
    ctx.fillRect(cardX, cy, 3, cardH);

    // Icon circle bg
    ctx.fillStyle = 'rgba(201,168,76,0.08)';
    ctx.beginPath();
    ctx.arc(cardX + 38, cy + cardH / 2, 16, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(g.icon, cardX + 38, cy + cardH / 2 + 7);

    // Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8d48b';
    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillText(g.name, cardX + 64, cy + 20);

    // Tag badge
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(201,168,76,0.6)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.fillText(g.tag, cardX + cardW - 16, cy + 20);

    // Description
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(g.desc, cardX + 64, cy + 40);
  });

  // ===== QR Code 区域 =====
  ctx.textAlign = 'center';
  const qrTop = cardStartY + 5 * (cardH + gapY) + 55;

  // Decorative diamonds around QR
  drawDiamond(ctx, W / 2 - 140, qrTop + 120, 5, 'rgba(201,168,76,0.2)');
  drawDiamond(ctx, W / 2 + 140, qrTop + 120, 5, 'rgba(201,168,76,0.2)');

  // QR label
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.fillText('———  扫码进入  ———', W / 2, qrTop + 10);

  const qrSize = 200;
  const qrX = W / 2 - qrSize / 2;
  const qrCardY = qrTop + 28;

  // QR 背景卡片
  ctx.fillStyle = 'rgba(245,235,215,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 18, qrCardY - 18, qrSize + 36, qrSize + 36, 16);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize, margin: 2,
    color: { dark: '#1a0a30', light: '#f5e6d3' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrCardY, qrSize, qrSize);

  // QR 文字
  ctx.fillStyle = '#333';
  ctx.font = 'bold 13px "Noto Sans SC", sans-serif';
  ctx.fillText('微信扫码即可进入', W / 2, qrCardY + qrSize + 28);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.font = '11px sans-serif';
  ctx.fillText('inner-theater.github.io/1', W / 2, qrCardY + qrSize + 50);

  // ===== 底部 =====
  const footerY = H - 120;
  ctx.strokeStyle = 'rgba(201,168,76,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, footerY);
  ctx.lineTo(W - 140, footerY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(201,168,76,0.45)';
  ctx.font = '14px "Noto Serif SC", serif';
  ctx.fillText('不为你的纠结提供答案', W / 2, footerY + 32);
  ctx.fillText('而是帮你听见自己心底早已存在的声音', W / 2, footerY + 56);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '10px sans-serif';
  ctx.fillText('THE INNER THEATER · inner-theater.github.io/1', W / 2, footerY + 82);

  return canvas.toDataURL('image/png');
}

export default function SharePoster({ visible, onClose }) {
  const [posterUrl, setPosterUrl] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const url = await generatePoster();
      setPosterUrl(url);
    } catch { /* ignore */ }
    setGenerating(false);
  };

  if (visible && !posterUrl && !generating) {
    handleGenerate();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.85)', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '360px', width: '100%', maxHeight: '80vh',
              overflow: 'auto', borderRadius: '14px',
              background: generating ? 'rgba(26,10,46,0.9)' : 'transparent',
            }}
          >
            {generating ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#e8d48b' }}>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🎭</motion.span>
                <p style={{ fontSize: '14px', letterSpacing: '2px' }}>正在生成分享海报...</p>
              </div>
            ) : posterUrl ? (
              <img src={posterUrl} alt="内心剧场分享海报" style={{ width: '100%', borderRadius: '14px' }} />
            ) : null}
          </motion.div>

          {posterUrl && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => {
                const a = document.createElement('a');
                a.href = posterUrl;
                a.download = '内心剧场海报.png';
                a.click();
              }} style={{
                padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #c9a84c, #e8d48b)',
                color: '#1a0a2e', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', letterSpacing: '2px',
              }}>
                保存海报
              </button>
              <button onClick={onClose} style={{
                padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)', fontSize: '14px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
              }}>
                关闭
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
