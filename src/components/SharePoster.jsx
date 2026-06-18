import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

const SITE_URL = 'https://inner-theater.github.io/1/';

// 不再依赖外部图片，所有视觉元素 Canvas 手绘，保证质量和无水印

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
  // 深蓝-黑渐变，电影院般的底色
  const bgGrad = ctx.createRadialGradient(C, H * 0.38, 20, C, H * 0.45, W * 1.2);
  bgGrad.addColorStop(0, '#1a1e2e');
  bgGrad.addColorStop(0.45, '#0e101a');
  bgGrad.addColorStop(1, '#050508');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ============ 主聚光灯 — 多层叠加制造景深 ============
  // 最外层：非常淡的巨大光锥
  const light1 = ctx.createLinearGradient(0, 0, 0, H);
  light1.addColorStop(0, 'rgba(200,160,80,0.00)');
  light1.addColorStop(0.28, 'rgba(200,160,80,0.025)');
  light1.addColorStop(0.42, 'rgba(200,160,80,0.06)');
  light1.addColorStop(0.55, 'rgba(200,160,80,0.10)');
  light1.addColorStop(0.65, 'rgba(200,160,80,0.05)');
  light1.addColorStop(1, 'rgba(200,160,80,0.00)');
  ctx.fillStyle = light1;
  ctx.beginPath();
  ctx.moveTo(C - 380, 0);
  ctx.lineTo(C + 380, 0);
  ctx.lineTo(C + 220, H * 0.72);
  ctx.lineTo(C - 220, H * 0.72);
  ctx.fill();

  // 中间层：稍强
  const light2 = ctx.createLinearGradient(0, 0, 0, H);
  light2.addColorStop(0, 'rgba(200,160,80,0.00)');
  light2.addColorStop(0.30, 'rgba(200,160,80,0.01)');
  light2.addColorStop(0.42, 'rgba(200,160,80,0.04)');
  light2.addColorStop(0.50, 'rgba(200,160,80,0.10)');
  light2.addColorStop(0.58, 'rgba(200,160,80,0.06)');
  light2.addColorStop(1, 'rgba(200,160,80,0.00)');
  ctx.fillStyle = light2;
  ctx.beginPath();
  ctx.moveTo(C - 200, 0);
  ctx.lineTo(C + 200, 0);
  ctx.lineTo(C + 100, H * 0.65);
  ctx.lineTo(C - 100, H * 0.65);
  ctx.fill();

  // 核心光柱
  const light3 = ctx.createLinearGradient(0, 0, 0, H);
  light3.addColorStop(0, 'rgba(220,180,90,0.00)');
  light3.addColorStop(0.38, 'rgba(220,180,90,0.02)');
  light3.addColorStop(0.44, 'rgba(220,180,90,0.10)');
  light3.addColorStop(0.52, 'rgba(220,180,90,0.12)');
  light3.addColorStop(0.60, 'rgba(220,180,90,0.05)');
  light3.addColorStop(1, 'rgba(220,180,90,0.00)');
  ctx.fillStyle = light3;
  ctx.beginPath();
  ctx.moveTo(C - 60, 0);
  ctx.lineTo(C + 60, 0);
  ctx.lineTo(C + 40, H * 0.58);
  ctx.lineTo(C - 40, H * 0.58);
  ctx.fill();

  // ============ 地面光圈 ============
  const floorGlow = ctx.createRadialGradient(C, H * 0.55, 0, C, H * 0.55, 200);
  floorGlow.addColorStop(0, 'rgba(220,180,100,0.18)');
  floorGlow.addColorStop(0.2, 'rgba(200,160,80,0.10)');
  floorGlow.addColorStop(0.5, 'rgba(180,140,60,0.03)');
  floorGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(C, H * 0.55, 200, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // ============ 尘埃粒子 ============
  ctx.fillStyle = 'rgba(220,190,120,0.30)';
  const particles = [
    [C - 80, 180, 1.2], [C + 120, 200, 1.5], [C - 150, 260, 1.0], [C + 70, 300, 1.3],
    [C - 40, 350, 1.8], [C + 160, 380, 0.8], [C - 110, 430, 1.1], [C + 90, 460, 1.4],
    [C - 180, 500, 0.9], [C + 40, 520, 1.2], [C + 130, 560, 0.7], [C - 70, 590, 1.0],
    [C + 10, 320, 2.0], [C - 30, 220, 1.6], [C + 180, 340, 0.6],
  ];
  for (const [px, py, pr] of particles) {
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 对角线方向微光粒子
  ctx.fillStyle = 'rgba(220,190,120,0.15)';
  const dust = [
    [C - 60, 200, 0.6], [C + 50, 240, 0.8], [C - 20, 280, 0.5], [C + 100, 310, 0.7],
    [C - 90, 370, 0.6], [C + 30, 420, 0.9], [C - 140, 470, 0.5], [C + 80, 510, 0.7],
  ];
  for (const [dx, dy, dr] of dust) {
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ============ 中央圆形光晕（舞台灯光效果） ============
  const centerGlow = ctx.createRadialGradient(C, H * 0.42, 0, C, H * 0.42, 260);
  centerGlow.addColorStop(0, 'rgba(240,200,120,0.12)');
  centerGlow.addColorStop(0.3, 'rgba(220,170,80,0.06)');
  centerGlow.addColorStop(0.7, 'rgba(180,130,50,0.01)');
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(C, H * 0.42, 260, 0, Math.PI * 2);
  ctx.fill();

  // 小光环（更集中的光）
  const innerGlow = ctx.createRadialGradient(C, H * 0.42, 0, C, H * 0.42, 100);
  innerGlow.addColorStop(0, 'rgba(240,210,140,0.20)');
  innerGlow.addColorStop(0.5, 'rgba(200,160,80,0.06)');
  innerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(C, H * 0.42, 100, 0, Math.PI * 2);
  ctx.fill();

  // ============ 顶部暗渐变（标题区域更深） ============
  const topDark = ctx.createLinearGradient(0, 0, 0, 420);
  topDark.addColorStop(0, 'rgba(5,5,8,0.70)');
  topDark.addColorStop(0.45, 'rgba(5,5,8,0.25)');
  topDark.addColorStop(1, 'rgba(5,5,8,0.00)');
  ctx.fillStyle = topDark;
  ctx.fillRect(0, 0, W, 420);

  // ============ 底部暗渐变（QR 区域） ============
  const bottomDark = ctx.createLinearGradient(0, H - 320, 0, H);
  bottomDark.addColorStop(0, 'rgba(5,5,8,0.00)');
  bottomDark.addColorStop(0.4, 'rgba(5,5,8,0.55)');
  bottomDark.addColorStop(1, 'rgba(5,5,8,0.88)');
  ctx.fillStyle = bottomDark;
  ctx.fillRect(0, H - 320, W, 320);

  // ============ 文字层 ============
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 顶部英文标语
  ctx.fillStyle = 'rgba(200,160,100,0.28)';
  ctx.font = '11px "Georgia", "Times New Roman", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('A P S Y C H O L O G I C A L  ·  P L A Y H O U S E', C, 155);

  // 主标题
  const titleY = 265;
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;

  const titleGrad = ctx.createLinearGradient(0, titleY - 52, 0, titleY + 52);
  titleGrad.addColorStop(0, '#f5e0a8');
  titleGrad.addColorStop(0.4, '#efe0c0');
  titleGrad.addColorStop(0.55, '#faf0d8');
  titleGrad.addColorStop(0.7, '#efe0c0');
  titleGrad.addColorStop(1, '#c9a050');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 90px "PingFang SC", "Noto Sans SC", "STHeiti", "SimHei", sans-serif';
  ctx.fillText('内心剧场', C, titleY);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 英文副标题
  ctx.fillStyle = 'rgba(200,160,100,0.22)';
  ctx.font = 'italic 12px "Georgia", serif';
  ctx.fillText('T H E   I N N E R   T H E A T E R', C, 335);

  // 细分隔线
  ctx.strokeStyle = 'rgba(180,140,80,0.18)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(C - 140, 367);
  ctx.lineTo(C - 14, 367);
  ctx.moveTo(C + 14, 367);
  ctx.lineTo(C + 140, 367);
  ctx.stroke();
  ctx.fillStyle = 'rgba(180,140,80,0.22)';
  ctx.beginPath();
  ctx.arc(C, 367, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 核心 slogan
  ctx.fillStyle = 'rgba(245,230,205,0.72)';
  ctx.font = '20px "PingFang SC", "Noto Sans SC", "STHeiti", sans-serif';
  ctx.fillText('在你纠结时，听见心底的声音', C, 415);

  // 副 slogan
  ctx.fillStyle = 'rgba(220,200,170,0.45)';
  ctx.font = '15px "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.fillText('直觉 · 恐惧 · 未来 · 他人 · 价值 —— 五个维度，一次对话', C, 460);

  // ============ 右下角二维码 ============
  const qrSize = 98;
  const qrX = W - qrSize - 44;
  const qrY = H - qrSize - 52;

  // 二维码白底卡片
  ctx.fillStyle = '#f8f2e6';
  drawRoundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10);
  ctx.fill();

  // 生成二维码
  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize * 2,
    margin: 1,
    color: { dark: '#1a1a1a', light: '#f8f2e6' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

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
