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

  // ===== 背景渐变 =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a0a2e');
  bg.addColorStop(0.15, '#0d0418');
  bg.addColorStop(0.4, '#150828');
  bg.addColorStop(0.7, '#0d0418');
  bg.addColorStop(1, '#080210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ===== 顶部尖三角幕布 =====
  ctx.save();
  // 左幕布
  const leftCurtain = ctx.createLinearGradient(0, 0, 200, 400);
  leftCurtain.addColorStop(0, '#7a0015');
  leftCurtain.addColorStop(0.5, '#4a000c');
  leftCurtain.addColorStop(1, 'rgba(20,5,30,0.8)');
  ctx.fillStyle = leftCurtain;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(400, 0);
  ctx.lineTo(0, 400);
  ctx.closePath();
  ctx.fill();

  // 右幕布
  const rightCurtain = ctx.createLinearGradient(W, 0, W - 200, 400);
  rightCurtain.addColorStop(0, '#7a0015');
  rightCurtain.addColorStop(0.5, '#4a000c');
  rightCurtain.addColorStop(1, 'rgba(20,5,30,0.8)');
  ctx.fillStyle = rightCurtain;
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - 400, 0);
  ctx.lineTo(W, 400);
  ctx.closePath();
  ctx.fill();

  // 幕布褶皱阴影
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(120, 0);
  ctx.lineTo(0, 280);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - 120, 0);
  ctx.lineTo(W, 280);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ===== 金色声波装饰点 =====
  const dotCount = 25;
  const startX = 65;
  const endX = W - 65;
  const baseY = 220;

  for (let i = 0; i < dotCount; i++) {
    const t = i / (dotCount - 1);
    const x = startX + t * (endX - startX);
    // 中间高两边低的拱形
    const heightFactor = Math.sin(t * Math.PI);
    const y = baseY - heightFactor * 25;
    // 中间大两边小
    const w = 16 + heightFactor * 12;
    const h = 10 + heightFactor * 6;
    const alpha = 0.25 + heightFactor * 0.35;

    ctx.fillStyle = `rgba(201,168,76,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 聚光灯 =====
  for (let i = 0; i < 3; i++) {
    const lx = 180 + i * 195;
    const spotGrad = ctx.createLinearGradient(0, 280, 0, 750);
    spotGrad.addColorStop(0, 'rgba(255,240,200,0.08)');
    spotGrad.addColorStop(0.3, 'rgba(255,240,200,0.03)');
    spotGrad.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 110, 280);
    ctx.lineTo(lx - 4, 750);
    ctx.lineTo(lx + 4, 750);
    ctx.lineTo(lx + 110, 280);
    ctx.closePath();
    ctx.fill();
  }

  // ===== 标题区 =====
  ctx.textAlign = 'center';

  // 标题光晕
  const titleGlow = ctx.createRadialGradient(W / 2, 320, 30, W / 2, 320, 200);
  titleGlow.addColorStop(0, 'rgba(232,212,139,0.12)');
  titleGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = titleGlow;
  ctx.fillRect(W / 2 - 200, 200, 400, 250);

  // 主标题
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 56px "Noto Serif SC", serif';
  ctx.fillText('内心剧场', W / 2, 330);

  // 英文
  ctx.fillStyle = 'rgba(232,212,139,0.35)';
  ctx.font = 'italic 14px "Playfair Display", serif';
  ctx.fillText('THE INNER THEATER', W / 2, 365);

  // 装饰线
  const lineGrad = ctx.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, 'rgba(201,168,76,0.4)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 120, 395);
  ctx.lineTo(W / 2 + 120, 395);
  ctx.stroke();

  // Slogan
  ctx.fillStyle = '#f5e6d3';
  ctx.font = '17px "Noto Sans SC", sans-serif';
  ctx.fillText('听见你心底的声音', W / 2, 425);

  // 简介
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '13px "Noto Sans SC", sans-serif';
  ctx.fillText('一个为年轻人设计的决策辅助工具', W / 2, 475);
  ctx.fillText('5个心理剧场，帮你听见自己心底早已存在的答案', W / 2, 500);

  // ===== 五大剧场 =====
  const sectionY = 560;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '12px "Noto Sans SC", sans-serif';
  ctx.fillText('五大剧场', W / 2, sectionY);

  // 游戏卡片 - 双列
  const cols = 2;
  const cardW = 280, cardH = 70;
  const gapX = 30, gapY = 20;
  const startX = (W - (cols * cardW + (cols - 1) * gapX)) / 2;

  GAMES.forEach((g, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = startX + col * (cardW + gapX);
    const cy = sectionY + 35 + row * (cardH + gapY);

    // Card bg
    ctx.fillStyle = 'rgba(30,15,60,0.4)';
    ctx.strokeStyle = 'rgba(201,168,76,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 10);
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(g.icon, cx + 16, cy + 42);

    // Name
    ctx.fillStyle = '#e8d48b';
    ctx.font = 'bold 15px "Noto Sans SC", sans-serif';
    ctx.fillText(g.name, cx + 52, cy + 28);

    // Desc
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.fillText(g.desc, cx + 52, cy + 50);
  });

  // ===== QR Code =====
  const lastRow = 2;
  const qrY = sectionY + 35 + (lastRow + 1) * (cardH + gapY) + 40;

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px "Noto Sans SC", sans-serif';
  ctx.fillText('扫码进入内心剧场', W / 2, qrY);

  const qrSize = 180;
  const qrX = W / 2 - qrSize / 2;
  const qrCardY = qrY + 15;

  ctx.fillStyle = 'rgba(245,235,215,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 14, qrCardY - 14, qrSize + 28, qrSize + 28, 12);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize, margin: 2,
    color: { dark: '#1a0a30', light: '#f5e6d3' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrCardY, qrSize, qrSize);

  ctx.fillStyle = '#333';
  ctx.font = '12px "Noto Sans SC", sans-serif';
  ctx.fillText('微信扫码可访问', W / 2, qrCardY + qrSize + 28);

  // ===== 底部 =====
  const footerY = H - 100;
  ctx.strokeStyle = 'rgba(201,168,76,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(140, footerY);
  ctx.lineTo(W - 140, footerY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(201,168,76,0.4)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.fillText('不为你的纠结提供答案 · 而是帮你听见自己', W / 2, footerY + 32);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
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
