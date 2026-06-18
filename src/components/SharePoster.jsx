import React from 'react';
import QRCode from 'qrcode';

const POSTER_BG = './images/A_vertical_poster_design_for_a_2026-06-18T06-48-58.png';

export default function SharePoster({ visible, onClose }) {
  React.useEffect(() => {
    if (!visible) return;
    generatePoster().catch(e => console.error('Poster generation failed:', e)).finally(onClose);
  }, [visible]);

  return null; // 不需要任何 UI
}

async function generatePoster() {
  const W = 750, H = 1334;

  const bgImage = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = POSTER_BG;
  });

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  const bgRatio = bgImage.width / bgImage.height;
  const canvasRatio = W / H;
  let sx = 0, sy = 0, sw = bgImage.width, sh = bgImage.height;
  if (bgRatio > canvasRatio) {
    sw = bgImage.height * canvasRatio;
    sx = (bgImage.width - sw) / 2;
  } else {
    sh = bgImage.width / canvasRatio;
    sy = (bgImage.height - sh) / 2;
  }
  ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, W, H);

  const qrSize = 100, qrMargin = 24;
  const qrX = W - qrSize - qrMargin, qrY = H - qrSize - qrMargin;

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 10);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(window.location.origin || 'https://inner-theater.github.io/1/', { width: qrSize, margin: 1 });
  const qrImg = await new Promise((resolve, reject) => {
    const qri = new Image();
    qri.onload = () => resolve(qri);
    qri.onerror = reject;
    qri.src = qrDataUrl;
  });
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  c.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '内心剧场_分享海报.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png', 1.0);
}
