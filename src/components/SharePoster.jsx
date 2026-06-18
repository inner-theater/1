import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

const SITE_URL = 'https://inner-theater.github.io/1/';

const GAMES = [
  { name: '本能之手', icon: '🤲', desc: '抓住命运的光球' },
  { name: '反向恐惧清单', icon: '🎭', desc: '删去恐惧留下底线' },
  { name: '平行时空来信', icon: '✉️', desc: 'AI写下未来的信' },
  { name: '朋友灵魂拷问室', icon: '🔮', desc: '借朋友的视角看自己' },
  { name: '价值天平拍卖会', icon: '⚖️', desc: '用金币称量价值观' },
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

async function generatePoster() {
  const W = 750, H = 1334;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ===== 深紫渐变背景 =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0218');
  bg.addColorStop(0.3, '#150a28');
  bg.addColorStop(0.6, '#1e1038');
  bg.addColorStop(1, '#0a0218');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ===== 顶部剧场幕布 =====
  ctx.save();
  const curtainGrad = ctx.createLinearGradient(0, 0, 0, 300);
  curtainGrad.addColorStop(0, '#6b0000');
  curtainGrad.addColorStop(0.4, '#4a0000');
  curtainGrad.addColorStop(0.7, '#2a0010');
  curtainGrad.addColorStop(1, 'rgba(10,2,24,0)');
  ctx.fillStyle = curtainGrad;

  // Left curtain drape
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(340, 0);
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    ctx.lineTo(340 * t, 220 + Math.sin(t * Math.PI * 2.5) * 50 * (1 - t));
  }
  ctx.lineTo(0, 300);
  ctx.closePath();
  ctx.fill();

  // Right curtain drape
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - 340, 0);
  for (let i = 14; i >= 0; i--) {
    const t = i / 13;
    ctx.lineTo(W - 340 + 340 * (1 - t), 220 + Math.sin(t * Math.PI * 2.5) * 50 * (1 - t));
  }
  ctx.lineTo(W, 300);
  ctx.closePath();
  ctx.fill();

  // Golden tassels
  for (let i = 0; i < 32; i++) {
    const x = 45 + i * 21;
    const h = 14 + Math.sin(i * 0.7) * 6;
    ctx.fillStyle = `rgba(201,168,76,${0.3 + Math.sin(i * 0.5) * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(x, 288, 7, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ===== 聚光灯效果 =====
  for (let i = 0; i < 3; i++) {
    const lx = 200 + i * 175;
    const spotGrad = ctx.createLinearGradient(0, 0, 0, 600);
    spotGrad.addColorStop(0, 'rgba(255,255,220,0.06)');
    spotGrad.addColorStop(0.3, 'rgba(255,255,220,0.03)');
    spotGrad.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 100, 280);
    ctx.lineTo(lx - 4, 880);
    ctx.lineTo(lx + 4, 880);
    ctx.lineTo(lx + 100, 280);
    ctx.closePath();
    ctx.fill();
  }

  // ===== 标题区 =====
  // Main title glow
  const titleGlow = ctx.createRadialGradient(W / 2, 380, 20, W / 2, 380, 250);
  titleGlow.addColorStop(0, 'rgba(232,212,139,0.2)');
  titleGlow.addColorStop(1, 'rgba(232,212,139,0)');
  ctx.fillStyle = titleGlow;
  ctx.fillRect(W / 2 - 250, 200, 500, 300);

  // 内心剧场
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 56px "Noto Serif SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.fillText('内心剧场', W / 2, 400);

  // English subtitle
  ctx.fillStyle = 'rgba(232,212,139,0.4)';
  ctx.font = 'italic 16px "Playfair Display", serif';
  ctx.fillText('THE INNER THEATER', W / 2, 436);

  // 分隔线
  const dividerGrad = ctx.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
  dividerGrad.addColorStop(0, 'rgba(201,168,76,0)');
  dividerGrad.addColorStop(0.5, 'rgba(201,168,76,0.4)');
  dividerGrad.addColorStop(1, 'rgba(201,168,76,0)');
  ctx.strokeStyle = dividerGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 460);
  ctx.lineTo(W / 2 + 120, 460);
  ctx.stroke();

  // ===== Slogan =====
  ctx.fillStyle = '#f5e6d3';
  ctx.font = '18px "Noto Sans SC", sans-serif';
  ctx.fillText('听见你心底的声音', W / 2, 500);

  // 装饰点
  ctx.fillStyle = 'rgba(201,168,76,0.4)';
  ctx.beginPath();
  ctx.arc(W / 2 - 160, 495, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.arc(W / 2 + 160, 495, 3, 0, Math.PI * 2); ctx.fill();

  // ===== 简介 =====
  const introY = 540;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px "Noto Sans SC", sans-serif';
  const intro1 = '一个为年轻人设计的决策辅助工具';
  const intro2 = '5个心理剧场，帮你听见自己心底早已存在的答案';
  ctx.fillText(intro1, W / 2, introY);
  ctx.fillText(intro2, W / 2, introY + 28);

  // ===== 5个游戏卡片 =====
  const cardStartY = 620;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('───  五大剧场  ───', W / 2, cardStartY);

  const cardW = 200, cardH = 56;
  const cols = 2;
  const gapX = 30, gapY = 14;
  const startX = (W - (cols * cardW + (cols - 1) * gapX)) / 2;

  GAMES.forEach((g, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = startX + col * (cardW + gapX);
    const cy = cardStartY + 28 + row * (cardH + gapY);

    // Card background
    ctx.fillStyle = 'rgba(30,15,60,0.5)';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,168,76,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icon
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(g.icon, cx + 12, cy + 34);

    // Name + desc
    ctx.fillStyle = '#e8d48b';
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.fillText(g.name, cx + 44, cy + 24);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.fillText(g.desc, cx + 44, cy + 44);
  });

  // Last card might be alone on a row (5 games, 2 cols)
  const lastRow = 2; // row index for game index 4 (0-based: row 2)
  const qrY = cardStartY + 28 + (lastRow + 1) * (cardH + gapY) + 30;

  // ===== QR Code =====
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '12px "Noto Sans SC", sans-serif';
  ctx.fillText('扫码进入内心剧场', W / 2, qrY);

  const qrSize = 180;
  const qrX = W / 2 - qrSize / 2;
  const qrBlockY = qrY + 12;

  // QR card
  ctx.fillStyle = 'rgba(245,230,211,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 14, qrBlockY - 14, qrSize + 28, qrSize + 28, 14);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize, margin: 2,
    color: { dark: '#150a28', light: '#f5e6d3' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrBlockY, qrSize, qrSize);

  // QR hint
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = '11px sans-serif';
  ctx.fillText('微信扫码可访问', W / 2, qrBlockY + qrSize + 26);

  // ===== 底部 =====
  const footerY = H - 100;
  ctx.strokeStyle = 'rgba(201,168,76,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, footerY); ctx.lineTo(W - 120, footerY); ctx.stroke();

  ctx.fillStyle = 'rgba(201,168,76,0.5)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.fillText('不为你的纠结提供答案 · 而是帮你听见自己', W / 2, footerY + 36);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '10px sans-serif';
  ctx.fillText('inner-theater.github.io/1', W / 2, footerY + 58);

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

  // Generate on open
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
