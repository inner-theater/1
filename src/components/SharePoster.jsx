import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

const SITE_URL = 'https://inner-theater.github.io/1/';
const POSTER_BG = './images/A_premium_dark_psychological_t_2026-06-18T05-50-30.png';

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
  const W = 750, H = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const C = W / 2;

  // 1. 加载AI生成的背景图，居中裁切 cover
  const bgImg = await loadImage(POSTER_BG);
  const imgRatio = bgImg.width / bgImg.height;
  const canvasRatio = W / H;
  let sx, sy, sWidth, sHeight;
  if (imgRatio > canvasRatio) {
    sHeight = bgImg.height;
    sWidth = bgImg.height * canvasRatio;
    sx = (bgImg.width - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = bgImg.width;
    sHeight = bgImg.width / canvasRatio;
    sx = 0;
    sy = (bgImg.height - sHeight) / 2;
  }
  ctx.drawImage(bgImg, sx, sy, sWidth, sHeight, 0, 0, W, H);

  // 2. 顶部暗渐变 — 保证标题可读
  const topDark = ctx.createLinearGradient(0, 0, 0, 360);
  topDark.addColorStop(0, 'rgba(0,0,0,0.55)');
  topDark.addColorStop(0.5, 'rgba(0,0,0,0.20)');
  topDark.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topDark;
  ctx.fillRect(0, 0, W, 360);

  // 3. 底部暗渐变 — 保证QR可读 + 覆盖水印
  const bottomDark = ctx.createLinearGradient(0, H - 280, 0, H);
  bottomDark.addColorStop(0, 'rgba(0,0,0,0)');
  bottomDark.addColorStop(0.35, 'rgba(0,0,0,0.50)');
  bottomDark.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = bottomDark;
  ctx.fillRect(0, H - 280, W, 280);

  // 额外覆盖水印区域（右下角 170×60）
  ctx.fillStyle = 'rgba(0,0,0,0.95)';
  ctx.fillRect(W - 175, H - 65, 175, 65);

  // 4. 标题 — 居中大字
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 英文装饰行
  ctx.fillStyle = 'rgba(212, 171, 96, 0.35)';
  ctx.font = '10px "Georgia", "Times New Roman", serif';
  ctx.fillText('A  PSYCHOLOGICAL  PLAYHOUSE', C, 130);

  // 主标题 — 阴影 + 金色
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#e8d48b';
  ctx.font = 'bold 82px "PingFang SC", "Noto Sans SC", "STHeiti", sans-serif';
  ctx.fillText('内心剧场', C, 220);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 英文副标题
  ctx.fillStyle = 'rgba(232, 212, 139, 0.25)';
  ctx.font = 'italic 11px "Georgia", serif';
  ctx.fillText('T H E   I N N E R   T H E A T E R', C, 260);

  // 分隔线 + 圆点
  ctx.strokeStyle = 'rgba(200, 160, 80, 0.20)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(C - 100, 290);
  ctx.lineTo(C - 12, 290);
  ctx.moveTo(C + 12, 290);
  ctx.lineTo(C + 100, 290);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200, 160, 80, 0.25)';
  ctx.beginPath();
  ctx.arc(C, 290, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 口号
  ctx.fillStyle = 'rgba(245, 230, 210, 0.70)';
  ctx.font = '18px "PingFang SC", "STHeiti", sans-serif';
  ctx.fillText('听见你心底的声音', C, 330);

  // 5. 右下角二维码 — 白底圆角，放在暗渐变上
  const qrSize = 90;
  const qrX = W - qrSize - 42;
  const qrY = H - qrSize - 42;

  // 白底圆角卡片
  ctx.fillStyle = 'rgba(245, 240, 230, 0.92)';
  roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize * 2,
    margin: 1,
    color: { dark: '#0a0a0a', light: '#f5ebd7' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 6. 底部一句话
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.font = '11px "PingFang SC", sans-serif';
  ctx.fillText('不为你的纠结提供答案，而是帮你听见心底早已存在的声音', C, H - 22);

  return canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
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
              background: generating ? '#0a0a0a' : 'transparent',
            }}
          >
            {generating ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#d4ab60' }}>
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
                padding: '12px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #b48c3c, #d4ab60)',
                color: '#0a0a0a', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer', letterSpacing: '2px',
              }}>
                保存海报
              </button>
              <button onClick={onClose} style={{
                padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.5)', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
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
