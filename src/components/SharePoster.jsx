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

async function generatePoster() {
  const W = 750, H = 1450;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ===== 深邃背景 =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0418');
  bg.addColorStop(0.25, '#1a0a2e');
  bg.addColorStop(0.55, '#150828');
  bg.addColorStop(0.8, '#0d0418');
  bg.addColorStop(1, '#080210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 星星点缀
  for (let i = 0; i < 50; i++) {
    const sx = Math.random() * W;
    const sy = 650 + Math.random() * (H - 650);
    ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.6 + Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 尖顶三角形幕布（完全匹配截图） =====
  ctx.save();
  const curtainGrad = ctx.createLinearGradient(0, 0, 0, 420);
  curtainGrad.addColorStop(0, '#8b0018');
  curtainGrad.addColorStop(0.2, '#6b0010');
  curtainGrad.addColorStop(0.45, '#4a0008');
  curtainGrad.addColorStop(0.7, '#2a0010');
  curtainGrad.addColorStop(0.9, 'rgba(15,5,30,0.6)');
  curtainGrad.addColorStop(1, 'rgba(10,2,24,0)');
  ctx.fillStyle = curtainGrad;

  // 左幕布 - 尖三角
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(380, 0);
  ctx.lineTo(0, 320);
  ctx.closePath();
  ctx.fill();

  // 右幕布 - 尖三角
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - 380, 0);
  ctx.lineTo(W, 320);
  ctx.closePath();
  ctx.fill();

  // ===== 金色椭圆点 —— 跳动的旋律 =====
  // 分布在标题上方，中间高两边低，像声波
  const melodyY = 230; // 点排的基线
  const melodyCount = 27;
  const melodySpan = W - 120;

  for (let i = 0; i < melodyCount; i++) {
    const t = i / (melodyCount - 1); // 0..1
    const mx = 60 + t * melodySpan;
    // 中间隆起，两边下沉 - 拱形
    const waveOffset = -Math.sin(t * Math.PI) * 28;
    const my = melodyY + waveOffset;
    // 中间点大，两边小
    const mw = 14 + Math.sin(t * Math.PI) * 10;
    const mh = 8 + Math.sin(t * Math.PI) * 5;

    ctx.fillStyle = `rgba(201,168,76,${0.3 + Math.sin(t * Math.PI) * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(mx, my, mw, mh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // ===== 聚光灯 =====
  for (let i = 0; i < 3; i++) {
    const lx = 180 + i * 195;
    const spotGrad = ctx.createLinearGradient(0, 280, 0, 850);
    spotGrad.addColorStop(0, 'rgba(255,240,210,0.07)');
    spotGrad.addColorStop(0.2, 'rgba(255,240,210,0.03)');
    spotGrad.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 120, 270);
    ctx.lineTo(lx - 5, 850);
    ctx.lineTo(lx + 5, 850);
    ctx.lineTo(lx + 120, 270);
    ctx.closePath();
    ctx.fill();
  }

  // ===== 标题区光晕 =====
  const titleGlow = ctx.createRadialGradient(W / 2, 340, 25, W / 2, 340, 240);
  titleGlow.addColorStop(0, 'rgba(232,212,139,0.14)');
  titleGlow.addColorStop(0.5, 'rgba(168,100,200,0.05)');
  titleGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = titleGlow;
  ctx.fillRect(W / 2 - 250, 200, 500, 300);

  // ===== 装饰横线 =====
  ctx.textAlign = 'center';
  const lineGrad = ctx.createLinearGradient(W / 2 - 140, 0, W / 2 + 140, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.3, 'rgba(201,168,76,0.3)');
  lineGrad.addColorStop(0.5, 'rgba(232,212,139,0.45)');
  lineGrad.addColorStop(0.7, 'rgba(201,168,76,0.3)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 140, 292);
  ctx.lineTo(W / 2 + 140, 292);
  ctx.stroke();

  // 装饰小圆点
  ctx.fillStyle = 'rgba(201,168,76,0.5)';
  ctx.beginPath(); ctx.arc(W / 2 - 150, 290, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W / 2 + 150, 290, 3.5, 0, Math.PI * 2); ctx.fill();

  // ===== 标题 =====
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 60px "Noto Serif SC", "SimSun", serif';
  ctx.fillText('内心剧场', W / 2, 350);

  // 英文副标题
  ctx.fillStyle = 'rgba(232,212,139,0.35)';
  ctx.font = 'italic 15px "Playfair Display", serif';
  ctx.fillText('THE INNER THEATER', W / 2, 388);

  // ===== Slogan 区 =====
  // 第二道装饰线
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 100, 418);
  ctx.lineTo(W / 2 + 100, 418);
  ctx.stroke();

  ctx.fillStyle = '#f5e6d3';
  ctx.font = '18px "Noto Sans SC", sans-serif';
  ctx.fillText('听见你心底的声音', W / 2, 455);

  // 简介
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '13px "Noto Sans SC", sans-serif';
  ctx.fillText('5个心理剧场 · 帮你听见自己心底早已存在的答案', W / 2, 510);

  // ===== 五大剧场卡片 =====
  const sectionTop = 570;

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.fillText('··· 五大剧场 ···', W / 2, sectionTop + 10);

  const cardW = 580, cardH = 66;
  const cardStartY = sectionTop + 48;
  const gapY = 18;
  const cardX = (W - cardW) / 2;

  GAMES.forEach((g, i) => {
    const cy = cardStartY + i * (cardH + gapY);

    // Card bg
    ctx.fillStyle = 'rgba(30,15,60,0.5)';
    ctx.strokeStyle = 'rgba(201,168,76,0.1)';
    ctx.lineWidth = 1;
    drawCard(ctx, cardX, cy, cardW, cardH, 12);

    // Left accent
    ctx.fillStyle = 'rgba(201,168,76,0.28)';
    ctx.fillRect(cardX, cy, 3, cardH);

    // Icon bg
    ctx.fillStyle = 'rgba(201,168,76,0.07)';
    ctx.beginPath();
    ctx.arc(cardX + 46, cy + cardH / 2, 20, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(g.icon, cardX + 46, cy + cardH / 2 + 9);

    // Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8d48b';
    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.fillText(g.name, cardX + 80, cy + 24);

    // Tag
    ctx.fillStyle = 'rgba(201,168,76,0.55)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(g.tag, cardX + cardW - 20, cy + 24);

    // Desc
    ctx.fillStyle = 'rgba(255,255,255,0.36)';
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(g.desc, cardX + 80, cy + 48);
  });

  // ===== QR Code =====
  ctx.textAlign = 'center';
  const qrTop = cardStartY + 5 * (cardH + gapY) + 55;

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.fillText('———  扫码进入内心剧场  ———', W / 2, qrTop);

  const qrSize = 200;
  const qrX = W / 2 - qrSize / 2;
  const qrCardY = qrTop + 20;

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
  ctx.fillText('微信扫码即可进入', W / 2, qrCardY + qrSize + 32);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.font = '11px sans-serif';
  ctx.fillText('inner-theater.github.io/1', W / 2, qrCardY + qrSize + 52);

  // ===== 底部 =====
  const footerY = H - 120;
  ctx.strokeStyle = 'rgba(201,168,76,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(140, footerY); ctx.lineTo(W - 140, footerY); ctx.stroke();

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
