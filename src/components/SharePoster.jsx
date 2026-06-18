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
  const W = 750, H = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ===== 深紫渐变背景 =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0218');
  bg.addColorStop(0.3, '#150a28');
  bg.addColorStop(0.65, '#1a0c32');
  bg.addColorStop(1, '#0a0218');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 稀疏星星
  for (let i = 0; i < 35; i++) {
    const sx = Math.random() * W;
    const sy = 600 + Math.random() * (H - 650);
    ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.5 + Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 舞台幕布 =====
  ctx.save();

  // 幕布主体渐变
  const curtainGrad = ctx.createLinearGradient(0, 0, 0, 380);
  curtainGrad.addColorStop(0, '#8b0000');
  curtainGrad.addColorStop(0.25, '#5c0a0a');
  curtainGrad.addColorStop(0.55, '#3a0008');
  curtainGrad.addColorStop(0.8, 'rgba(26,9,46,0.7)');
  curtainGrad.addColorStop(1, 'rgba(15,5,30,0)');
  ctx.fillStyle = curtainGrad;

  // 左幕布 - 自然褶皱
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(355, 0);
  ctx.quadraticCurveTo(340, 120, 355, 240);
  ctx.quadraticCurveTo(240, 200, 140, 280);
  ctx.quadraticCurveTo(70, 330, 0, 360);
  ctx.closePath();
  ctx.fill();

  // 右幕布 - 对称
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - 355, 0);
  ctx.quadraticCurveTo(W - 340, 120, W - 355, 240);
  ctx.quadraticCurveTo(W - 240, 200, W - 140, 280);
  ctx.quadraticCurveTo(W - 70, 330, W, 360);
  ctx.closePath();
  ctx.fill();

  // 幕布内侧暗褶
  ctx.fillStyle = 'rgba(60,0,12,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(100, 200, 30, 340);
  ctx.quadraticCurveTo(140, 260, 60, 160);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.quadraticCurveTo(W - 100, 200, W - 30, 340);
  ctx.quadraticCurveTo(W - 140, 260, W - 60, 160);
  ctx.closePath();
  ctx.fill();

  // 金色流苏
  for (let i = 0; i < 30; i++) {
    const x = 55 + i * 22;
    const dy = 290 + Math.sin(i * 0.55) * 8;
    ctx.strokeStyle = `rgba(201,168,76,${0.25 + Math.sin(i * 0.4) * 0.12})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, dy);
    ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 5, dy + 12, x + (Math.random() - 0.5) * 6, dy + 20 + Math.random() * 8);
    ctx.stroke();
  }
  ctx.restore();

  // ===== 聚光灯 =====
  for (let i = 0; i < 3; i++) {
    const lx = 180 + i * 195;
    const spotGrad = ctx.createLinearGradient(0, 270, 0, 850);
    spotGrad.addColorStop(0, 'rgba(255,245,210,0.08)');
    spotGrad.addColorStop(0.2, 'rgba(255,245,210,0.03)');
    spotGrad.addColorStop(1, 'rgba(255,245,210,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 130, 270);
    ctx.lineTo(lx - 5, 850);
    ctx.lineTo(lx + 5, 850);
    ctx.lineTo(lx + 130, 270);
    ctx.closePath();
    ctx.fill();
  }

  // ===== 金点旋律装饰 =====
  const numDots = 25;
  const dotsLeft = 70, dotsRight = W - 70;
  const dotBaseY = 310;

  for (let i = 0; i < numDots; i++) {
    const t = i / (numDots - 1);
    const dx = dotsLeft + t * (dotsRight - dotsLeft);
    const arch = Math.sin(t * Math.PI);
    const dy = dotBaseY - arch * 30;
    const dw = 14 + arch * 10;
    const dh = 8 + arch * 5;
    const da = 0.3 + arch * 0.35;

    ctx.fillStyle = `rgba(201,168,76,${da})`;
    ctx.beginPath();
    ctx.ellipse(dx, dy, dw, dh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 标题区 =====
  ctx.textAlign = 'center';

  // 光晕
  const glow = ctx.createRadialGradient(W / 2, 380, 20, W / 2, 380, 220);
  glow.addColorStop(0, 'rgba(168,85,247,0.12)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(W / 2 - 220, 260, 440, 260);

  // 装饰横线
  const line = ctx.createLinearGradient(W / 2 - 130, 0, W / 2 + 130, 0);
  line.addColorStop(0, 'transparent');
  line.addColorStop(0.4, 'rgba(201,168,76,0.35)');
  line.addColorStop(0.5, 'rgba(232,212,139,0.5)');
  line.addColorStop(0.6, 'rgba(201,168,76,0.35)');
  line.addColorStop(1, 'transparent');
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 130, 375);
  ctx.lineTo(W / 2 + 130, 375);
  ctx.stroke();

  // 标题大字
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 56px "Noto Serif SC", "SimSun", serif';
  ctx.fillText('内心剧场', W / 2, 425);

  // 英文
  ctx.fillStyle = 'rgba(232,212,139,0.38)';
  ctx.font = 'italic 15px "Playfair Display", serif';
  ctx.fillText('THE INNER THEATER', W / 2, 460);

  // 第二道线
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 100, 488);
  ctx.lineTo(W / 2 + 100, 488);
  ctx.stroke();

  // Slogan
  ctx.fillStyle = '#f5e6d3';
  ctx.font = '17px "Noto Sans SC", sans-serif';
  ctx.fillText('听见你心底的声音', W / 2, 522);

  // 简介
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '13px "Noto Sans SC", sans-serif';
  ctx.fillText('一个为年轻人设计的决策辅助工具', W / 2, 565);
  ctx.fillText('5个心理剧场，帮你听见自己心底早已存在的答案', W / 2, 590);

  // ===== 五大剧场卡片 =====
  const gridTop = 650;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '12px "Noto Serif SC", serif';
  ctx.fillText('··· 五大剧场 ···', W / 2, gridTop);

  // 双列卡片布局
  const cols = 2;
  const cardW = 285, cardH = 68;
  const gapX = 28, gapY = 18;
  const gridX = (W - (cols * cardW + (cols - 1) * gapX)) / 2;

  GAMES.forEach((g, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = gridX + col * (cardW + gapX);
    const cy = gridTop + 32 + row * (cardH + gapY);

    // Card
    ctx.fillStyle = 'rgba(25,12,50,0.45)';
    ctx.strokeStyle = 'rgba(201,168,76,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.stroke();

    // 左侧金色竖线
    ctx.fillStyle = 'rgba(201,168,76,0.25)';
    ctx.fillRect(cx, cy, 3, cardH);

    // 图标
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(g.icon, cx + 18, cy + 40);

    // 名称
    ctx.fillStyle = '#e8d48b';
    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillText(g.name, cx + 54, cy + 26);

    // 描述
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.fillText(g.desc, cx + 54, cy + 50);
  });

  // ===== QR Code =====
  const qrSectionTop = gridTop + 32 + 3 * (cardH + gapY) + 55;

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('———  扫码进入内心剧场  ———', W / 2, qrSectionTop);

  const qrSize = 190;
  const qrX = W / 2 - qrSize / 2;
  const qrCardY = qrSectionTop + 18;

  ctx.fillStyle = 'rgba(245,235,215,0.96)';
  ctx.beginPath();
  ctx.roundRect(qrX - 16, qrCardY - 16, qrSize + 32, qrSize + 32, 14);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize, margin: 2,
    color: { dark: '#1a0a30', light: '#f5e6d3' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrCardY, qrSize, qrSize);

  ctx.fillStyle = '#2a2020';
  ctx.font = 'bold 13px "Noto Sans SC", sans-serif';
  ctx.fillText('微信扫码即可进入', W / 2, qrCardY + qrSize + 30);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.font = '10px sans-serif';
  ctx.fillText('inner-theater.github.io/1', W / 2, qrCardY + qrSize + 50);

  // ===== 底部 =====
  const footerY = H - 110;
  ctx.strokeStyle = 'rgba(201,168,76,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(130, footerY);
  ctx.lineTo(W - 130, footerY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(201,168,76,0.45)';
  ctx.font = '14px "Noto Serif SC", serif';
  ctx.fillText('不为你的纠结提供答案', W / 2, footerY + 32);
  ctx.fillText('而是帮你听见自己心底早已存在的声音', W / 2, footerY + 58);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '10px sans-serif';
  ctx.fillText('THE INNER THEATER · 每个人内心都有一座剧场', W / 2, footerY + 86);

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
