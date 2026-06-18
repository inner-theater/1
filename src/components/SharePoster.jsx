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

  // ===== 深邃渐变背景 =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0418');
  bg.addColorStop(0.25, '#1a0a2e');
  bg.addColorStop(0.55, '#150828');
  bg.addColorStop(0.8, '#0d0418');
  bg.addColorStop(1, '#080210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 星星点缀（只在下半部分）
  for (let i = 0; i < 50; i++) {
    const sx = Math.random() * W;
    const sy = 650 + Math.random() * (H - 650);
    const so = 0.1 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(255,255,255,${so})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.6 + Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 顶部红色幕布（截图风格） =====
  ctx.save();

  // 主幕布渐变 - 深红到暗紫
  const curtainGrad = ctx.createLinearGradient(0, 0, 0, 500);
  curtainGrad.addColorStop(0, '#8b0018');
  curtainGrad.addColorStop(0.15, '#6b0010');
  curtainGrad.addColorStop(0.35, '#4a0008');
  curtainGrad.addColorStop(0.6, '#2a0010');
  curtainGrad.addColorStop(0.85, 'rgba(15,5,30,0.7)');
  curtainGrad.addColorStop(1, 'rgba(10,2,24,0)');
  ctx.fillStyle = curtainGrad;

  // 左侧幕布 - 大波浪褶皱
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(400, 0);
  ctx.quadraticCurveTo(350, 180, 380, 320);
  ctx.quadraticCurveTo(300, 260, 320, 180);
  ctx.quadraticCurveTo(280, 120, 300, 60);
  ctx.quadraticCurveTo(200, 100, 0, 380);
  ctx.closePath();
  ctx.fill();

  // 右侧幕布 - 对称波浪
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - 400, 0);
  ctx.quadraticCurveTo(W - 350, 180, W - 380, 320);
  ctx.quadraticCurveTo(W - 300, 260, W - 320, 180);
  ctx.quadraticCurveTo(W - 280, 120, W - 300, 60);
  ctx.quadraticCurveTo(W - 200, 100, W, 380);
  ctx.closePath();
  ctx.fill();

  // 幕布内侧深色褶皱
  ctx.fillStyle = 'rgba(60,0,15,0.4)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(120, 200, 60, 400);
  ctx.quadraticCurveTo(180, 280, 120, 160);
  ctx.quadraticCurveTo(100, 100, 0, 200);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.quadraticCurveTo(W - 120, 200, W - 60, 400);
  ctx.quadraticCurveTo(W - 180, 280, W - 120, 160);
  ctx.quadraticCurveTo(W - 100, 100, W, 200);
  ctx.closePath();
  ctx.fill();

  // 金色装饰点 - 截图中的那一排圆点
  ctx.fillStyle = 'rgba(201,168,76,0.6)';
  for (let i = 0; i < 28; i++) {
    const tx = 60 + i * 23;
    const ty = 245 + Math.sin(i * 0.5) * 5;
    const tw = 10 + Math.sin(i * 0.8) * 3;
    ctx.beginPath();
    ctx.ellipse(tx, ty, tw, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // ===== 聚光灯效果 =====
  for (let i = 0; i < 3; i++) {
    const lx = 180 + i * 195;
    const spotGrad = ctx.createLinearGradient(0, 280, 0, 900);
    spotGrad.addColorStop(0, 'rgba(255,240,200,0.08)');
    spotGrad.addColorStop(0.15, 'rgba(255,240,200,0.04)');
    spotGrad.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 120, 280);
    ctx.lineTo(lx - 5, 900);
    ctx.lineTo(lx + 5, 900);
    ctx.lineTo(lx + 120, 280);
    ctx.closePath();
    ctx.fill();
  }

  // ===== 标题区域 =====
  ctx.textAlign = 'center';

  // 装饰横线 - 金色渐变
  const lineGrad = ctx.createLinearGradient(W / 2 - 140, 0, W / 2 + 140, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.3, 'rgba(201,168,76,0.3)');
  lineGrad.addColorStop(0.5, 'rgba(232,212,139,0.5)');
  lineGrad.addColorStop(0.7, 'rgba(201,168,76,0.3)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 140, 305);
  ctx.lineTo(W / 2 + 140, 305);
  ctx.stroke();

  // 标题光晕
  const titleGlow = ctx.createRadialGradient(W / 2, 340, 30, W / 2, 340, 200);
  titleGlow.addColorStop(0, 'rgba(232,212,139,0.15)');
  titleGlow.addColorStop(0.4, 'rgba(168,100,200,0.06)');
  titleGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = titleGlow;
  ctx.fillRect(W / 2 - 200, 220, 400, 280);

  // 主标题
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 62px "Noto Serif SC", "SimSun", serif';
  ctx.fillText('内心剧场', W / 2, 360);

  // 英文副标题
  ctx.fillStyle = 'rgba(232,212,139,0.4)';
  ctx.font = 'italic 16px "Playfair Display", serif';
  ctx.fillText('THE INNER THEATER', W / 2, 395);

  // 装饰点
  ctx.fillStyle = 'rgba(201,168,76,0.5)';
  ctx.beginPath(); ctx.arc(W / 2 - 155, 305, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W / 2 + 155, 305, 4, 0, Math.PI * 2); ctx.fill();

  // 分隔线2
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 100, 425);
  ctx.lineTo(W / 2 + 100, 425);
  ctx.stroke();

  // Slogan
  ctx.fillStyle = '#f5e6d3';
  ctx.font = '18px "Noto Sans SC", sans-serif';
  ctx.fillText('听见你心底的声音', W / 2, 460);

  // 简介
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '13px "Noto Sans SC", sans-serif';
  ctx.fillText('一个为年轻人设计的决策辅助工具', W / 2, 510);
  ctx.fillText('5个心理剧场，帮你听见自己心底早已存在的答案', W / 2, 535);

  // ===== 五大剧场 =====
  const sectionTop = 600;

  // 分隔装饰
  ctx.strokeStyle = 'rgba(201,168,76,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 80, sectionTop);
  ctx.lineTo(W / 2 - 10, sectionTop);
  ctx.moveTo(W / 2 + 10, sectionTop);
  ctx.lineTo(W / 2 + 80, sectionTop);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px "Noto Serif SC", serif';
  ctx.fillText('五大剧场', W / 2, sectionTop + 4);

  // 卡片参数 - 单列，更宽
  const cardW = 580, cardH = 64;
  const cardStartY = sectionTop + 45;
  const gapY = 16;
  const cardX = (W - cardW) / 2;

  GAMES.forEach((g, i) => {
    const cy = cardStartY + i * (cardH + gapY);

    // Card bg - 半透明深色
    ctx.fillStyle = 'rgba(30,15,60,0.55)';
    ctx.strokeStyle = 'rgba(201,168,76,0.1)';
    ctx.lineWidth = 1;
    drawCard(ctx, cardX, cy, cardW, cardH, 12);

    // 左侧金色细线
    ctx.fillStyle = 'rgba(201,168,76,0.3)';
    ctx.fillRect(cardX, cy, 3, cardH);

    // 图标背景圆
    ctx.fillStyle = 'rgba(201,168,76,0.08)';
    ctx.beginPath();
    ctx.arc(cardX + 44, cy + cardH / 2, 20, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(g.icon, cardX + 44, cy + cardH / 2 + 9);

    // Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8d48b';
    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.fillText(g.name, cardX + 78, cy + 24);

    // Tag - 右侧
    ctx.fillStyle = 'rgba(201,168,76,0.6)';
    ctx.font = '11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(g.tag, cardX + cardW - 20, cy + 24);

    // Desc
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(g.desc, cardX + 78, cy + 46);
  });

  // ===== QR Code =====
  const qrTop = cardStartY + 5 * (cardH + gapY) + 55;

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '13px "Noto Serif SC", serif';
  ctx.fillText('———  扫码进入内心剧场  ———', W / 2, qrTop);

  const qrSize = 200;
  const qrX = W / 2 - qrSize / 2;
  const qrCardY = qrTop + 20;

  // QR 背景
  ctx.fillStyle = 'rgba(245,235,215,0.96)';
  ctx.beginPath();
  ctx.roundRect(qrX - 16, qrCardY - 16, qrSize + 32, qrSize + 32, 14);
  ctx.fill();

  // 阴影
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize, margin: 2,
    color: { dark: '#1a0a30', light: '#f5e6d3' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrCardY, qrSize, qrSize);

  // QR 文字
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
  ctx.beginPath();
  ctx.moveTo(140, footerY);
  ctx.lineTo(W - 140, footerY);
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
