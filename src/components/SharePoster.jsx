import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

const SITE_URL = 'https://inner-theater.github.io/1/';

const GAMES = [
  { id: 1, title: '本能之手', tag: '感官先行 · 光球抉择', icon: '🤲' },
  { id: 2, title: '反向恐惧清单', tag: '剥开焦虑 · 找到底线', icon: '🎭' },
  { id: 3, title: '平行时空来信', tag: '另一条轨迹 · AI 来信', icon: '✉️' },
  { id: 4, title: '朋友灵魂拷问室', tag: '借他人之镜 · 见真实', icon: '👥' },
  { id: 5, title: '价值天平拍卖会', tag: '百枚金币 · 竞标价值', icon: '⚖️' },
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

function drawRR(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawFaceProfile(ctx, cx, cy, facing, size) {
  // Draw one profile silhouette facing left (facing=-1) or right (facing=1)
  const dir = facing;
  const s = size;

  ctx.beginPath();
  // Forehead top
  ctx.moveTo(cx, cy - s * 0.6);
  // Forehead curve
  ctx.bezierCurveTo(cx + dir * s * 0.25, cy - s * 0.55, cx + dir * s * 0.4, cy - s * 0.3, cx + dir * s * 0.32, cy - s * 0.08);
  // Nose bridge + tip
  ctx.lineTo(cx + dir * s * 0.22, cy + s * 0.02);
  ctx.bezierCurveTo(cx + dir * s * 0.35, cy + s * 0.05, cx + dir * s * 0.38, cy + s * 0.1, cx + dir * s * 0.32, cy + s * 0.14);
  // Upper lip
  ctx.bezierCurveTo(cx + dir * s * 0.28, cy + s * 0.2, cx + dir * s * 0.3, cy + s * 0.26, cx + dir * s * 0.2, cy + s * 0.28);
  // Lower lip + chin
  ctx.bezierCurveTo(cx + dir * s * 0.28, cy + s * 0.34, cx + dir * s * 0.2, cy + s * 0.42, cx, cy + s * 0.45);
  // Jaw / neck
  ctx.bezierCurveTo(cx - dir * s * 0.08, cy + s * 0.42, cx - dir * s * 0.05, cy + s * 0.49, cx, cy + s * 0.55);
}

const POSTER_BG = './images/A_dramatic_warm_lit_theater_st_2026-06-18T06-42-23.png';

async function generatePoster() {
  const W = 750, H = 1334;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const C = W / 2;

  // ============ 1. 加载并绘制剧场背景图 ============
  const bgImg = await loadImage(POSTER_BG);
  // 图片 1080×1920，Canvas 750×1334，比例几乎一致，直接缩放
  ctx.drawImage(bgImg, 0, 0, W, H);

  // 顶部暗化（保证标题可读）
  const topDark = ctx.createLinearGradient(0, 0, 0, 280);
  topDark.addColorStop(0, 'rgba(5, 3, 2, 0.55)');
  topDark.addColorStop(0.7, 'rgba(5, 3, 2, 0.15)');
  topDark.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topDark;
  ctx.fillRect(0, 0, W, 280);

  // 底部暗化（保证游戏标签 + QR 可读，同时覆盖 AI 水印）
  const bottomDark = ctx.createLinearGradient(0, H - 480, 0, H);
  bottomDark.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomDark.addColorStop(0.3, 'rgba(5, 3, 2, 0.4)');
  bottomDark.addColorStop(0.65, 'rgba(5, 3, 2, 0.8)');
  bottomDark.addColorStop(1, 'rgba(5, 3, 2, 0.97)');
  ctx.fillStyle = bottomDark;
  ctx.fillRect(0, H - 480, W, 480);

  // 额外覆盖右下角水印区域
  ctx.fillStyle = 'rgba(5, 3, 2, 0.95)';
  ctx.fillRect(W - 200, H - 100, 200, 100);

  // 中央区域轻微暗化（突出双人脸）
  const midDark = ctx.createRadialGradient(C, 430, 200, C, 430, 450);
  midDark.addColorStop(0, 'rgba(0, 0, 0, 0)');
  midDark.addColorStop(1, 'rgba(5, 3, 2, 0.25)');
  ctx.fillStyle = midDark;
  ctx.fillRect(0, 200, W, 450);

  // ============ 2. 双人脸 — 内心对话 ============
  const faceCx = C, faceCy = 420, faceSize = 160;
  const faceGap = 55; // gap between the two faces

  // 中央光芒（两人脸中间的光源，象征对话与看见）
  const centerGlow = ctx.createRadialGradient(C, faceCy - 20, 5, C, faceCy - 20, 80);
  centerGlow.addColorStop(0, 'rgba(255, 230, 160, 0.45)');
  centerGlow.addColorStop(0.3, 'rgba(230, 190, 100, 0.2)');
  centerGlow.addColorStop(0.6, 'rgba(180, 130, 60, 0.06)');
  centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(C, faceCy - 20, 80, 0, Math.PI * 2);
  ctx.fill();

  // 左脸（面朝右）
  const leftCx = C - faceGap / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(210, 160, 50, 0.25)';
  ctx.shadowBlur = 30;
  // 填充
  const leftFill = ctx.createLinearGradient(leftCx, faceCy - 60, leftCx + faceSize * 0.3, faceCy);
  leftFill.addColorStop(0, 'rgba(45, 25, 10, 0.85)');
  leftFill.addColorStop(0.5, 'rgba(35, 18, 6, 0.65)');
  leftFill.addColorStop(1, 'rgba(20, 10, 4, 0.35)');
  ctx.fillStyle = leftFill;
  drawFaceProfile(ctx, leftCx, faceCy, 1, faceSize);
  ctx.fill();
  // 金色轮廓
  ctx.strokeStyle = 'rgba(220, 175, 70, 0.55)';
  ctx.lineWidth = 2.2;
  drawFaceProfile(ctx, leftCx, faceCy, 1, faceSize);
  ctx.stroke();
  // 内轮廓微光
  ctx.strokeStyle = 'rgba(250, 215, 140, 0.3)';
  ctx.lineWidth = 0.7;
  drawFaceProfile(ctx, leftCx + 1, faceCy - 1, 1, faceSize - 2);
  ctx.stroke();
  ctx.restore();

  // 右脸（面朝左）
  const rightCx = C + faceGap / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(210, 160, 50, 0.25)';
  ctx.shadowBlur = 30;
  const rightFill = ctx.createLinearGradient(rightCx, faceCy - 60, rightCx - faceSize * 0.3, faceCy);
  rightFill.addColorStop(0, 'rgba(45, 25, 10, 0.85)');
  rightFill.addColorStop(0.5, 'rgba(35, 18, 6, 0.65)');
  rightFill.addColorStop(1, 'rgba(20, 10, 4, 0.35)');
  ctx.fillStyle = rightFill;
  drawFaceProfile(ctx, rightCx, faceCy, -1, faceSize);
  ctx.fill();
  ctx.strokeStyle = 'rgba(220, 175, 70, 0.55)';
  ctx.lineWidth = 2.2;
  drawFaceProfile(ctx, rightCx, faceCy, -1, faceSize);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(250, 215, 140, 0.3)';
  ctx.lineWidth = 0.7;
  drawFaceProfile(ctx, rightCx - 1, faceCy - 1, -1, faceSize - 2);
  ctx.stroke();
  ctx.restore();

  // 两人脸之间的连接弧线（视觉上让它们对话）
  ctx.strokeStyle = 'rgba(220, 180, 100, 0.15)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(C, faceCy - faceSize * 0.3, faceGap / 2 + 8, -0.6, Math.PI + 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(C, faceCy - faceSize * 0.3, faceGap / 2 + 8, Math.PI - 0.6, Math.PI * 2 + 0.6);
  ctx.stroke();

  // 微型光点（像星芒，在两张脸之间）
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const px = C + Math.cos(angle) * 18;
    const py = faceCy - faceSize * 0.2 + Math.sin(angle) * 12;
    ctx.fillStyle = `rgba(250, 220, 150, ${0.2 + i * 0.05})`;
    ctx.beginPath();
    ctx.arc(px, py, 0.8 + i * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============ 4. 标题 ============
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 顶部英文装饰
  ctx.fillStyle = 'rgba(200, 160, 80, 0.25)';
  ctx.font = '11px "Georgia", serif';
  ctx.fillText('A  P S Y C H O L O G I C A L   T H E A T E R', C, 112);

  // 主标题 "内心剧场"
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 4;
  const titleGrad = ctx.createLinearGradient(0, 135, 0, 205);
  titleGrad.addColorStop(0, '#dbb840');
  titleGrad.addColorStop(0.25, '#f5e6b8');
  titleGrad.addColorStop(0.5, '#fdf3d0');
  titleGrad.addColorStop(0.75, '#ebd288');
  titleGrad.addColorStop(1, '#b88a28');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 82px "STKaiti", "KaiTi", "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.fillText('内心剧场', C, 170);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 英文副标题
  ctx.fillStyle = 'rgba(200, 160, 80, 0.22)';
  ctx.font = 'italic 12px "Georgia", serif';
  ctx.fillText('T H E   I N N E R   T H E A T E R', C, 228);

  // ============ 5. 五束光线 + 游戏标签 ============
  const gamesY = 710;
  const gameGap = (W - 120) / GAMES.length;
  const gameStartX = 60 + gameGap / 2;

  GAMES.forEach((game, i) => {
    const gx = gameStartX + gameGap * i;

    // 从双人脸底部向每个游戏发一束微光
    const rayGrad = ctx.createLinearGradient(faceCx, faceCy + faceSize * 0.55, gx, gamesY - 20);
    rayGrad.addColorStop(0, 'rgba(200, 150, 60, 0.12)');
    rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.strokeStyle = rayGrad;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(faceCx, faceCy + faceSize * 0.5);
    ctx.lineTo(gx, gamesY - 20);
    ctx.stroke();

    // 光点
    const dotGlow = ctx.createRadialGradient(gx, gamesY - 12, 0, gx, gamesY - 12, 10);
    dotGlow.addColorStop(0, 'rgba(240, 200, 120, 0.55)');
    dotGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = dotGlow;
    ctx.beginPath();
    ctx.arc(gx, gamesY - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // 实心小圆点
    ctx.fillStyle = 'rgba(220, 180, 80, 0.7)';
    ctx.beginPath();
    ctx.arc(gx, gamesY - 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // 编号
    ctx.fillStyle = 'rgba(180, 140, 80, 0.35)';
    ctx.font = '9px "Georgia", serif';
    ctx.fillText(`0${i + 1}`, gx, gamesY + 16);

    // 图标
    ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.fillText(game.icon, gx, gamesY + 42);

    // 游戏名
    ctx.fillStyle = 'rgba(240, 225, 200, 0.9)';
    ctx.font = 'bold 15px "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.fillText(game.title, gx, gamesY + 68);

    // tag
    ctx.fillStyle = 'rgba(180, 150, 120, 0.45)';
    ctx.font = '11px "PingFang SC", sans-serif';
    ctx.fillText(game.tag, gx, gamesY + 90);
  });

  // ============ 6. Slogan 区 ============
  const sloganY = gamesY + 150;
  // 分隔线
  ctx.strokeStyle = 'rgba(180, 140, 60, 0.12)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(C - 150, sloganY);
  ctx.lineTo(C - 10, sloganY);
  ctx.moveTo(C + 10, sloganY);
  ctx.lineTo(C + 150, sloganY);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200, 160, 80, 0.18)';
  ctx.beginPath();
  ctx.arc(C, sloganY, 2, 0, Math.PI * 2);
  ctx.fill();

  // slogan 文字
  ctx.fillStyle = 'rgba(210, 185, 150, 0.5)';
  ctx.font = '15px "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.fillText('五个维度，一场与自己的对话', C, sloganY + 35);

  // ============ 7. QR code ============
  const qrSize = 90;
  const qrX = W - qrSize - 52;
  const qrY = H - qrSize - 55;

  ctx.fillStyle = '#faf7f0';
  drawRR(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 10);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize * 2,
    margin: 1,
    color: { dark: '#1a1410', light: '#faf7f0' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 底部收尾
  ctx.fillStyle = 'rgba(160, 140, 110, 0.22)';
  ctx.font = '11px "PingFang SC", sans-serif';
  ctx.fillText('你的内心剧场 · 现在开场', C, H - 20);

  return c.toDataURL('image/png');
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
    } catch (e) { console.error('Poster generation failed:', e); }
    setGenerating(false);
  };

  if (visible && !posterUrl && !generating) handleGenerate();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '360px', width: '100%', maxHeight: '80vh', overflow: 'auto', borderRadius: '14px' }}
          >
            {generating ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#c9a84c' }}>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>🎭</motion.span>
                <p style={{ fontSize: '14px', letterSpacing: '2px' }}>正在生成分享海报...</p>
              </div>
            ) : posterUrl ? (
              <img src={posterUrl} alt="内心剧场" style={{ width: '100%', borderRadius: '14px' }} />
            ) : null}
          </motion.div>
          {posterUrl && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => { const a = document.createElement('a'); a.href = posterUrl; a.download = '内心剧场海报.png'; a.click(); }}
                style={{ padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #b48c3c, #d4ab60)',
                  color: '#0a0a0a', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', letterSpacing: '2px' }}>保存海报</button>
              <button onClick={onClose}
                style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>关闭</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
