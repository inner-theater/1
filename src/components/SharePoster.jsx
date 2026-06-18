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

function drawCard(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

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

  // ===== 深紫渐变背景 =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0218');
  bg.addColorStop(0.3, '#150a28');
  bg.addColorStop(0.6, '#1e1038');
  bg.addColorStop(1, '#0a0218');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 星星点缀
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * W;
    const sy = 620 + Math.random() * (H - 620);
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 顶部剧场幕布（复古红色+褶皱） =====
  ctx.save();
  const curtainGrad = ctx.createLinearGradient(0, 0, 0, 340);
  curtainGrad.addColorStop(0, '#6b0000');
  curtainGrad.addColorStop(0.4, '#4a0000');
  curtainGrad.addColorStop(0.7, '#2a0010');
  curtainGrad.addColorStop(1, 'rgba(10,2,24,0)');
  ctx.fillStyle = curtainGrad;

  // Left curtain drape
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(370, 0);
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    ctx.lineTo(370 * t, 260 + Math.sin(t * Math.PI * 2.8) * 55 * (1 - t * 0.7));
  }
  ctx.lineTo(0, 340);
  ctx.closePath();
  ctx.fill();

  // Right curtain drape
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - 370, 0);
  for (let i = 16; i >= 0; i--) {
    const t = i / 15;
    ctx.lineTo(W - 370 + 370 * (1 - t), 260 + Math.sin(t * Math.PI * 2.8) * 55 * (1 - t * 0.7));
  }
  ctx.lineTo(W, 340);
  ctx.closePath();
  ctx.fill();

  // Left inner fold
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(80, 180, 0, 300);
  ctx.quadraticCurveTo(140, 220, 0, 180);
  ctx.quadraticCurveTo(100, 120, 0, 80);
  ctx.closePath();
  ctx.fillStyle = 'rgba(80,0,20,0.45)';
  ctx.fill();

  // Right inner fold
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.quadraticCurveTo(W - 80, 180, W, 300);
  ctx.quadraticCurveTo(W - 140, 220, W, 180);
  ctx.quadraticCurveTo(W - 100, 120, W, 80);
  ctx.closePath();
  ctx.fillStyle = 'rgba(80,0,20,0.45)';
  ctx.fill();

  // Golden tassels
  for (let i = 0; i < 34; i++) {
    const x = 40 + i * 20;
    const waveY = 300 + Math.sin(i * 0.65) * 10;
    ctx.strokeStyle = `rgba(201,168,76,${0.2 + Math.sin(i * 0.45) * 0.1})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, waveY);
    ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 6, waveY + 10, x + (Math.random() - 0.5) * 8, waveY + 18 + Math.random() * 10);
    ctx.stroke();
  }
  ctx.restore();

  // ===== 聚光灯效果 =====
  for (let i = 0; i < 3; i++) {
    const lx = 200 + i * 175;
    const spotGrad = ctx.createLinearGradient(0, 0, 0, 650);
    spotGrad.addColorStop(0, 'rgba(255,255,210,0.07)');
    spotGrad.addColorStop(0.2, 'rgba(255,255,210,0.035)');
    spotGrad.addColorStop(1, 'rgba(255,255,210,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 110, 310);
    ctx.lineTo(lx - 4, 960);
    ctx.lineTo(lx + 4, 960);
    ctx.lineTo(lx + 110, 310);
    ctx.closePath();
    ctx.fill();
  }

  // ===== 装饰框 =====
  ctx.strokeStyle = 'rgba(201,168,76,0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = 'rgba(201,168,76,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  // ===== 标题区光晕 =====
  const titleBgGlow = ctx.createRadialGradient(W / 2, 400, 30, W / 2, 400, 280);
  titleBgGlow.addColorStop(0, 'rgba(168,85,247,0.18)');
  titleBgGlow.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = titleBgGlow;
  ctx.fillRect(W / 2 - 280, 220, 560, 360);

  // 装饰线
  ctx.strokeStyle = 'rgba(201,168,76,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 160, 415);
  ctx.lineTo(W / 2 + 160, 415);
  ctx.stroke();

  ctx.fillStyle = 'rgba(201,168,76,0.4)';
  ctx.beginPath(); ctx.arc(W / 2 - 180, 410, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W / 2 + 180, 410, 3, 0, Math.PI * 2); ctx.fill();

  // ===== 大标题 =====
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 58px "Noto Serif SC", "SimSun", serif';
  ctx.fillText('内心剧场', W / 2, 380);

  ctx.fillStyle = 'rgba(232,212,139,0.35)';
  ctx.font = 'italic 15px "Playfair Display", serif';
  ctx.fillText('THE INNER THEATER', W / 2, 440);

  // Slogan
  ctx.fillStyle = '#f5e6d3';
  ctx.font = '17px "Noto Sans SC", sans-serif';
  ctx.fillText('听见你心底的声音', W / 2, 485);

  drawDiamond(ctx, W / 2, 520, 6, 'rgba(201,168,76,0.35)');

  // ===== 一句话介绍 =====
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = '13px "Noto Sans SC", sans-serif';
  ctx.fillText('5个心理剧场 · 用游戏的方式做重要决定', W / 2, 555);
  ctx.fillText('不是替你选择，是帮你听见自己', W / 2, 580);

  // ===== 五大剧场卡片 =====
  const sectionTop = 630;
  drawDiamond(ctx, W / 2, sectionTop, 5, 'rgba(201,168,76,0.2)');

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '12px "Noto Serif SC", serif';
  ctx.fillText('··· 五大剧场 ···', W / 2, sectionTop + 22);

  // Card params
  const cardW = 560, cardH = 56;
  const cardStartY = sectionTop + 55;
  const gapY = 18;
  const cardX = (W - cardW) / 2;

  GAMES.forEach((g, i) => {
    const cy = cardStartY + i * (cardH + gapY);

    // Card bg
    ctx.fillStyle = 'rgba(22,12,48,0.65)';
    ctx.strokeStyle = 'rgba(201,168,76,0.1)';
    ctx.lineWidth = 1;
    drawCard(ctx, cardX, cy, cardW, cardH, 10);

    // Left accent
    ctx.fillStyle = 'rgba(201,168,76,0.25)';
    ctx.fillRect(cardX, cy, 3, cardH);

    // Icon bg circle
    ctx.fillStyle = 'rgba(201,168,76,0.07)';
    ctx.beginPath();
    ctx.arc(cardX + 40, cy + cardH / 2, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(g.icon, cardX + 40, cy + cardH / 2 + 8);

    // Name + tag
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8d48b';
    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillText(g.name, cardX + 68, cy + 20);

    ctx.fillStyle = 'rgba(201,168,76,0.55)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(g.tag, cardX + cardW - 16, cy + 20);

    // Desc
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(g.desc, cardX + 68, cy + 40);
  });

  // ===== QR Code =====
  ctx.textAlign = 'center';
  const qrTop = cardStartY + 5 * (cardH + gapY) + 60;

  drawDiamond(ctx, W / 2, qrTop - 5, 5, 'rgba(201,168,76,0.2)');
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.fillText('———  扫码进入  ———', W / 2, qrTop + 14);

  const qrSize = 200;
  const qrX = W / 2 - qrSize / 2;
  const qrCardY = qrTop + 32;

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

  ctx.fillStyle = '#333';
  ctx.font = 'bold 13px "Noto Sans SC", sans-serif';
  ctx.fillText('微信扫码即可进入', W / 2, qrCardY + qrSize + 30);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.font = '11px sans-serif';
  ctx.fillText('inner-theater.github.io/1', W / 2, qrCardY + qrSize + 52);

  // ===== 底部 =====
  const footerY = H - 110;
  ctx.strokeStyle = 'rgba(201,168,76,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(150, footerY); ctx.lineTo(W - 150, footerY); ctx.stroke();

  ctx.fillStyle = 'rgba(201,168,76,0.45)';
  ctx.font = '14px "Noto Serif SC", serif';
  ctx.fillText('不为你的纠结提供答案', W / 2, footerY + 32);
  ctx.fillText('而是帮你听见自己心底早已存在的声音', W / 2, footerY + 56);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.font = '10px sans-serif';
  ctx.fillText('THE INNER THEATER · 每个人内心都有一座剧场', W / 2, footerY + 82);

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
