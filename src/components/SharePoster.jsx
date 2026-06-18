import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

const SITE_URL = 'https://inner-theater.github.io/1/';

const GAMES = [
  { id: 1, title: '本能之手', tag: '感官先行 · 光球抉择', icon: '✋' },
  { id: 2, title: '反向恐惧清单', tag: '剥开焦虑 · 找到底线', icon: '📝' },
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

function drawHeart(ctx, cx, cy, s) {
  ctx.beginPath();
  const topY = cy - s * 0.35;
  const bottomY = cy + s * 0.42;
  const leftX = cx - s * 0.48;
  const rightX = cx + s * 0.48;
  // Left lobe
  ctx.moveTo(cx, bottomY);
  ctx.bezierCurveTo(cx - s * 0.52, cy + s * 0.12, leftX, topY, cx, topY);
  // Right lobe
  ctx.bezierCurveTo(rightX, topY, cx + s * 0.52, cy + s * 0.12, cx, bottomY);
}

async function generatePoster() {
  const W = 750, H = 1334;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const C = W / 2;

  // ============ 1. 背景 ============
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0906');
  bg.addColorStop(0.4, '#0a0604');
  bg.addColorStop(1, '#050302');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 中心暖光氛围
  const glow = ctx.createRadialGradient(C, 420, 60, C, 420, 500);
  glow.addColorStop(0, 'rgba(200, 150, 60, 0.10)');
  glow.addColorStop(0.4, 'rgba(160, 110, 40, 0.04)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ============ 2. 舞台帷幕（两侧暗红丝绒） ============
  function drawCurtain(side, xStart, width) {
    // 帷幕渐变
    const curtainGrad = ctx.createLinearGradient(xStart, 0, xStart + width, 0);
    if (side === 'left') {
      curtainGrad.addColorStop(0, 'rgba(30, 8, 6, 0.95)');
      curtainGrad.addColorStop(0.3, 'rgba(45, 12, 8, 0.8)');
      curtainGrad.addColorStop(0.65, 'rgba(55, 15, 10, 0.55)');
      curtainGrad.addColorStop(0.85, 'rgba(40, 10, 6, 0.2)');
      curtainGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      curtainGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      curtainGrad.addColorStop(0.15, 'rgba(40, 10, 6, 0.2)');
      curtainGrad.addColorStop(0.35, 'rgba(55, 15, 10, 0.55)');
      curtainGrad.addColorStop(0.7, 'rgba(45, 12, 8, 0.8)');
      curtainGrad.addColorStop(1, 'rgba(30, 8, 6, 0.95)');
    }
    ctx.fillStyle = curtainGrad;
    ctx.fillRect(xStart, 0, width, H);

    // 褶皱线
    ctx.strokeStyle = 'rgba(60, 18, 10, 0.3)';
    ctx.lineWidth = 1;
    const foldCount = 7;
    const foldStep = width / (foldCount + 1);
    for (let i = 1; i <= foldCount; i++) {
      const fx = xStart + foldStep * i;
      ctx.beginPath();
      ctx.moveTo(fx, 80);
      // 微微弯曲的褶皱线
      ctx.quadraticCurveTo(fx + (side === 'left' ? 8 : -8), 450, fx, H);
      ctx.stroke();
    }

    // 内侧弧线（帷幕被拉开的收束线）
    ctx.strokeStyle = 'rgba(80, 25, 15, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const arcX = side === 'left' ? xStart + width : xStart;
    ctx.moveTo(arcX, 80);
    ctx.bezierCurveTo(arcX + (side === 'left' ? 40 : -40), 230, arcX + (side === 'left' ? 60 : -60), 380, arcX + (side === 'left' ? 30 : -30), 580);
    ctx.stroke();
  }

  drawCurtain('left', 0, 180);
  drawCurtain('right', W - 180, 180);

  // ============ 3. 聚光灯 ============
  // 主光束
  const beam = ctx.createLinearGradient(0, 0, 0, 720);
  beam.addColorStop(0, 'rgba(220, 180, 80, 0.08)');
  beam.addColorStop(0.3, 'rgba(200, 150, 60, 0.06)');
  beam.addColorStop(0.7, 'rgba(160, 100, 30, 0.02)');
  beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(C - 140, 0);
  ctx.lineTo(C + 140, 0);
  ctx.lineTo(C + 200, 700);
  ctx.lineTo(C - 200, 700);
  ctx.closePath();
  ctx.fill();

  // 第二层更窄的光束
  const beam2 = ctx.createLinearGradient(0, 0, 0, 650);
  beam2.addColorStop(0, 'rgba(240, 200, 100, 0.05)');
  beam2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = beam2;
  ctx.beginPath();
  ctx.moveTo(C - 60, 0);
  ctx.lineTo(C + 60, 0);
  ctx.lineTo(C + 90, 580);
  ctx.lineTo(C - 90, 580);
  ctx.closePath();
  ctx.fill();

  // ============ 4. 舞台地面 ============
  // 地面光斑
  const floorGlow = ctx.createRadialGradient(C, 600, 20, C, 600, 200);
  floorGlow.addColorStop(0, 'rgba(200, 150, 60, 0.12)');
  floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(C, 600, 220, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // 透视线
  ctx.strokeStyle = 'rgba(180, 140, 80, 0.08)';
  ctx.lineWidth = 0.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const vx = C + i * 70;
    ctx.moveTo(vx, 570);
    ctx.lineTo(vx + i * 20, H);
    ctx.stroke();
  }
  // 舞台前沿线
  ctx.strokeStyle = 'rgba(180, 140, 80, 0.15)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(C - 250, 620);
  ctx.lineTo(C + 250, 620);
  ctx.stroke();

  // ============ 5. 心 ============
  const heartCx = C, heartCy = 430, heartSize = 240;

  // 心形柔光
  ctx.save();
  ctx.shadowColor = 'rgba(210, 160, 50, 0.35)';
  ctx.shadowBlur = 50;

  // 心形填充（渐层金色）
  const heartFill = ctx.createRadialGradient(heartCx, heartCy - 30, 20, heartCx, heartCy, heartSize * 0.6);
  heartFill.addColorStop(0, 'rgba(40, 25, 5, 0.9)');
  heartFill.addColorStop(0.6, 'rgba(30, 18, 3, 0.7)');
  heartFill.addColorStop(1, 'rgba(15, 8, 2, 0.3)');
  ctx.fillStyle = heartFill;
  drawHeart(ctx, heartCx, heartCy, heartSize);
  ctx.fill();
  ctx.restore();

  // 心形内侧微光
  ctx.save();
  ctx.shadowColor = 'rgba(240, 200, 100, 0.18)';
  ctx.shadowBlur = 15;
  const heartInner = ctx.createRadialGradient(heartCx, heartCy - 50, 10, heartCx, heartCy - 10, heartSize * 0.3);
  heartInner.addColorStop(0, 'rgba(250, 220, 140, 0.25)');
  heartInner.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = heartInner;
  drawHeart(ctx, heartCx, heartCy, heartSize * 0.75);
  ctx.fill();
  ctx.restore();

  // 心形金边轮廓
  ctx.strokeStyle = 'rgba(220, 180, 80, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(240, 200, 100, 0.25)';
  ctx.shadowBlur = 12;
  drawHeart(ctx, heartCx, heartCy, heartSize);
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 第二层更细的亮边
  ctx.strokeStyle = 'rgba(250, 220, 150, 0.35)';
  ctx.lineWidth = 0.8;
  drawHeart(ctx, heartCx, heartCy, heartSize - 3);
  ctx.stroke();

  // ============ 6. 心形内部小舞台 ============
  // 小幕布弧线
  ctx.strokeStyle = 'rgba(200, 100, 60, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(heartCx - 48, heartCy + 18);
  ctx.quadraticCurveTo(heartCx - 36, heartCy - 28, heartCx - 12, heartCy - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(heartCx + 48, heartCy + 18);
  ctx.quadraticCurveTo(heartCx + 36, heartCy - 28, heartCx + 12, heartCy - 8);
  ctx.stroke();

  // 小舞台地板
  ctx.strokeStyle = 'rgba(200, 160, 80, 0.2)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(heartCx - 35, heartCy + 32);
  ctx.lineTo(heartCx + 35, heartCy + 32);
  ctx.stroke();

  // 小聚光点
  const spot = ctx.createRadialGradient(heartCx, heartCy + 8, 2, heartCx, heartCy + 8, 18);
  spot.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
  spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(heartCx, heartCy + 8, 18, 0, Math.PI * 2);
  ctx.fill();

  // ============ 7. 标题 ============
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

  // ============ 8. 五束光线 + 游戏标签 ============
  const gamesY = 710;
  const gameGap = (W - 120) / GAMES.length;
  const gameStartX = 60 + gameGap / 2;

  GAMES.forEach((game, i) => {
    const gx = gameStartX + gameGap * i;

    // 从心形底部向每个游戏发一束微光
    const rayGrad = ctx.createLinearGradient(heartCx, heartCy + heartSize * 0.42, gx, gamesY - 20);
    rayGrad.addColorStop(0, 'rgba(200, 150, 60, 0.12)');
    rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.strokeStyle = rayGrad;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(heartCx, heartCy + heartSize * 0.35);
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

  // ============ 9. Slogan 区 ============
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

  // ============ 10. 底部暗化 + QR ============
  const bottomDark = ctx.createLinearGradient(0, H - 300, 0, H);
  bottomDark.addColorStop(0, 'rgba(5, 3, 2, 0)');
  bottomDark.addColorStop(0.5, 'rgba(5, 3, 2, 0.7)');
  bottomDark.addColorStop(1, 'rgba(5, 3, 2, 0.95)');
  ctx.fillStyle = bottomDark;
  ctx.fillRect(0, H - 300, W, 300);

  // QR code
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
