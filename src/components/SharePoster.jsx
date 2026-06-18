import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

const SITE_URL = 'https://inner-theater.github.io/1/';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function drawRoundRect(ctx, x, y, w, h, r) {
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

async function generatePoster() {
  const W = 750, H = 1334;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const C = W / 2;

  // ============ 背景 ============
  // 深黑到深蓝黑的径向渐变
  const bgGrad = ctx.createRadialGradient(C, H * 0.35, 50, C, H * 0.5, W);
  bgGrad.addColorStop(0, '#1a1510');
  bgGrad.addColorStop(0.4, '#0d0a08');
  bgGrad.addColorStop(1, '#050403');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ============ 金色光晕氛围 ============
  // 顶部暖光
  const topGlow = ctx.createRadialGradient(C, 0, 0, C, 0, W * 0.8);
  topGlow.addColorStop(0, 'rgba(200,160,80,0.15)');
  topGlow.addColorStop(0.5, 'rgba(180,140,60,0.05)');
  topGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, H * 0.6);

  // 中央大光晕
  const centerGlow = ctx.createRadialGradient(C, H * 0.48, 0, C, H * 0.48, 280);
  centerGlow.addColorStop(0, 'rgba(220,180,100,0.20)');
  centerGlow.addColorStop(0.4, 'rgba(200,150,70,0.08)');
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(C, H * 0.48, 280, 0, Math.PI * 2);
  ctx.fill();

  // ============ 金色粒子/尘埃 ============
  const particles = [
    [120, 180, 2.5], [580, 220, 3], [200, 280, 2], [480, 320, 2.8],
    [150, 400, 1.8], [520, 450, 2.2], [280, 200, 1.5], [420, 260, 2],
    [180, 520, 2], [450, 580, 2.5], [320, 150, 1.8], [400, 180, 2.2],
    [100, 350, 1.5], [600, 380, 1.8], [250, 480, 2], [500, 520, 2.2],
    [350, 100, 1.5], [380, 120, 1.8],
  ];
  ctx.fillStyle = 'rgba(220,190,120,0.35)';
  for (const [px, py, pr] of particles) {
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 小粒子
  const smallParticles = [
    [80, 250, 1], [650, 300, 1.2], [180, 380, 0.8], [520, 420, 1],
    [300, 550, 0.9], [400, 600, 1.1], [140, 480, 0.8], [580, 500, 1],
  ];
  ctx.fillStyle = 'rgba(220,190,120,0.20)';
  for (const [px, py, pr] of smallParticles) {
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============ 中央金色面具/人脸轮廓 ============
  const maskY = H * 0.52;
  const maskScale = 1.0;

  // 外层光晕
  const maskGlow = ctx.createRadialGradient(C, maskY, 50, C, maskY, 200);
  maskGlow.addColorStop(0, 'rgba(200,160,80,0.30)');
  maskGlow.addColorStop(0.5, 'rgba(180,140,60,0.12)');
  maskGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = maskGlow;
  ctx.beginPath();
  ctx.arc(C, maskY, 200, 0, Math.PI * 2);
  ctx.fill();

  // 面具轮廓 - 金色线条
  ctx.strokeStyle = 'rgba(200,160,80,0.85)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 外轮廓 - 椭圆形的脸
  ctx.beginPath();
  ctx.ellipse(C, maskY, 130 * maskScale, 180 * maskScale, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 内部装饰线条 - 抽象的眼睛
  ctx.strokeStyle = 'rgba(200,160,80,0.60)';
  ctx.lineWidth = 1.8;
  // 左眼
  ctx.beginPath();
  ctx.arc(C - 45, maskY - 30, 25, 0, Math.PI * 2);
  ctx.stroke();
  // 右眼
  ctx.beginPath();
  ctx.arc(C + 45, maskY - 30, 25, 0, Math.PI * 2);
  ctx.stroke();

  // 鼻子线条
  ctx.beginPath();
  ctx.moveTo(C, maskY - 10);
  ctx.quadraticCurveTo(C - 8, maskY + 25, C, maskY + 45);
  ctx.quadraticCurveTo(C + 8, maskY + 25, C, maskY - 10);
  ctx.stroke();

  // 嘴巴 - 微笑弧线
  ctx.beginPath();
  ctx.arc(C, maskY + 75, 35, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // 额头装饰线
  ctx.strokeStyle = 'rgba(200,160,80,0.40)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(C - 60, maskY - 110);
  ctx.quadraticCurveTo(C, maskY - 130, C + 60, maskY - 110);
  ctx.stroke();

  // ============ 顶部暗化遮罩 ============
  const topDark = ctx.createLinearGradient(0, 0, 0, 200);
  topDark.addColorStop(0, 'rgba(5,4,3,0.85)');
  topDark.addColorStop(0.6, 'rgba(5,4,3,0.40)');
  topDark.addColorStop(1, 'rgba(5,4,3,0)');
  ctx.fillStyle = topDark;
  ctx.fillRect(0, 0, W, 200);

  // ============ 文字区域 ============
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 顶部英文
  ctx.fillStyle = 'rgba(200,160,100,0.35)';
  ctx.font = '10px "Georgia", "Times New Roman", serif';
  ctx.fillText('A  PSYCHOLOGICAL  PLAYHOUSE', C, 95);

  // 主标题 "内心剧场"
  const titleY = 175;
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 6;

  const titleGrad = ctx.createLinearGradient(0, titleY - 45, 0, titleY + 45);
  titleGrad.addColorStop(0, '#f8e8c0');
  titleGrad.addColorStop(0.3, '#fff8e8');
  titleGrad.addColorStop(0.5, '#faf0d0');
  titleGrad.addColorStop(0.7, '#e8d0a0');
  titleGrad.addColorStop(1, '#c9a050');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 78px "PingFang SC", "Noto Sans SC", "STHeiti", sans-serif';
  ctx.fillText('内心剧场', C, titleY);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 英文副标题
  ctx.fillStyle = 'rgba(200,160,100,0.30)';
  ctx.font = 'italic 11px "Georgia", serif';
  ctx.fillText('THE INNER THEATER', C, 235);

  // 分隔线 + 圆点
  ctx.strokeStyle = 'rgba(180,140,80,0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(C - 100, 265);
  ctx.lineTo(C - 12, 265);
  ctx.moveTo(C + 12, 265);
  ctx.lineTo(C + 100, 265);
  ctx.stroke();
  ctx.fillStyle = 'rgba(180,140,80,0.35)';
  ctx.beginPath();
  ctx.arc(C, 265, 3, 0, Math.PI * 2);
  ctx.fill();

  // 核心口号
  ctx.fillStyle = 'rgba(245,230,205,0.88)';
  ctx.font = '22px "PingFang SC", "Noto Sans SC", "STHeiti", sans-serif';
  ctx.fillText('听见你心底的声音', C, 310);

  // 描述文字
  ctx.fillStyle = 'rgba(200,180,150,0.50)';
  ctx.font = '14px "PingFang SC", sans-serif';
  ctx.fillText('一个为年轻人设计的决策辅助工具', C, 350);
  ctx.fillText('5个心理剧场，帮你听见自己心底早已存在的答案', C, 375);

  // ============ 五个游戏列表 ============
  const games = [
    { icon: '✋', name: '本能之手', desc: '光球替你在5秒内做选择' },
    { icon: '📝', name: '反向恐惧清单', desc: '删去恐惧，留下真正的底线' },
    { icon: '✉️', name: '平行时空来信', desc: 'AI生成不同未来的亲笔信' },
    { icon: '👥', name: '朋友灵魂拷问室', desc: '借朋友的视角照见自己' },
    { icon: '⚖️', name: '价值天平拍卖会', desc: '100枚金币竞标你的价值观' },
  ];

  const listStartY = 720;
  const lineHeight = 58;

  games.forEach((game, index) => {
    const y = listStartY + index * lineHeight;
    const num = String(index + 1).padStart(2, '0');

    // 编号
    ctx.fillStyle = 'rgba(180,140,80,0.35)';
    ctx.font = '12px "Georgia", serif';
    ctx.textAlign = 'left';
    ctx.fillText(num, 115, y);

    // 图标
    ctx.font = '18px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.fillText(game.icon, 150, y);

    // 游戏名称
    ctx.fillStyle = 'rgba(245,230,205,0.90)';
    ctx.font = '16px "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.fillText(game.name, 180, y);

    // 描述
    ctx.fillStyle = 'rgba(180,160,130,0.55)';
    ctx.font = '13px "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(game.desc, W - 115, y);

    // 分隔线（除最后一项）
    if (index < games.length - 1) {
      ctx.strokeStyle = 'rgba(180,140,80,0.12)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(115, y + lineHeight / 2);
      ctx.lineTo(W - 115, y + lineHeight / 2);
      ctx.stroke();
    }
  });

  // 恢复居中
  ctx.textAlign = 'center';

  // ============ 底部暗化 ============
  const bottomDark = ctx.createLinearGradient(0, H - 200, 0, H);
  bottomDark.addColorStop(0, 'rgba(5,4,3,0)');
  bottomDark.addColorStop(0.5, 'rgba(5,4,3,0.60)');
  bottomDark.addColorStop(1, 'rgba(5,4,3,0.90)');
  ctx.fillStyle = bottomDark;
  ctx.fillRect(0, H - 200, W, 200);

  // ============ 右下角二维码 ============
  const qrSize = 95;
  const qrX = W - qrSize - 50;
  const qrY = H - qrSize - 70;

  // 白底圆角卡片
  ctx.fillStyle = '#faf6f0';
  drawRoundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 8);
  ctx.fill();

  // 生成二维码
  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize * 2,
    margin: 1,
    color: { dark: '#1a1a1a', light: '#faf6f0' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // ============ 底部slogan ============
  ctx.fillStyle = 'rgba(180,160,130,0.35)';
  ctx.font = '12px "PingFang SC", sans-serif';
  ctx.fillText('不为你的纠结提供答案，而是帮你听见心底早已存在的声音', C, H - 28);

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
    } catch (e) {
      console.error('Poster generation failed:', e);
    }
    setGenerating(false);
  };

  if (visible && !posterUrl && !generating) {
    handleGenerate();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '360px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              borderRadius: '14px',
            }}
          >
            {generating ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#c9a84c' }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}
                >
                  🎭
                </motion.span>
                <p style={{ fontSize: '14px', letterSpacing: '2px' }}>正在生成分享海报...</p>
              </div>
            ) : posterUrl ? (
              <img src={posterUrl} alt="内心剧场分享海报" style={{ width: '100%', borderRadius: '14px' }} />
            ) : null}
          </motion.div>

          {posterUrl && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = posterUrl;
                  a.download = '内心剧场海报.png';
                  a.click();
                }}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #b48c3c, #d4ab60)',
                  color: '#0a0a0a',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '2px',
                }}
              >
                保存海报
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
