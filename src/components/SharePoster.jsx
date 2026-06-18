import React from 'react';
import QRCode from 'qrcode';

const POSTER_BG = './images/A_vertical_poster_design_for_a_2026-06-18T06-48-58.png';

export default function SharePoster({ visible, onClose }) {
  const [posterUrl, setPosterUrl] = React.useState(null);
  const [generating, setGenerating] = React.useState(true);

  React.useEffect(() => {
    if (!visible) return;
    setGenerating(true);
    setPosterUrl(null);
    generatePoster().then(url => {
      setPosterUrl(url);
      setGenerating(false);
    }).catch(e => {
      console.error('Poster generation failed:', e);
      setGenerating(false);
    });
  }, [visible]);

  if (!visible) return null;

  async function handleShare() {
    if (!posterUrl) return;
    const blob = await fetch(posterUrl).then(r => r.blob());
    const file = new File([blob], '内心剧场_分享海报.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: '内心剧场',
          text: '五幕心理剧 · 听见你心底的声音',
        });
      } catch {}
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: '内心剧场',
          text: '五幕心理剧 · 听见你心底的声音',
          url: window.location.origin,
        });
      } catch {}
    }
  }

  function handleDownload() {
    if (!posterUrl) return;
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = '内心剧场_分享海报.png';
    a.click();
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)',
    }} onClick={onClose}>
      {/* 海报预览区 */}
      <div style={{
        maxHeight: '70vh', maxWidth: '90vw', aspectRatio: '750/1334',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(200,160,80,0.1)',
        background: '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} onClick={e => e.stopPropagation()}>
        {generating ? (
          <div style={{ color: 'rgba(230,210,170,0.5)', fontSize: 15, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎭</div>
            正在生成海报...
          </div>
        ) : posterUrl ? (
          <img src={posterUrl} alt="内心剧场分享海报" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ color: 'rgba(230,210,170,0.5)', fontSize: 14 }}>生成失败</div>
        )}
      </div>

      {/* 操作按钮 */}
      {!generating && posterUrl && (
        <div style={{ display: 'flex', gap: 16, marginTop: 24 }} onClick={e => e.stopPropagation()}>
          <button onClick={handleDownload} style={{
            padding: '12px 32px', borderRadius: 10, border: '1px solid rgba(201,168,76,0.4)',
            background: 'rgba(201,168,76,0.1)', color: '#e8c87a',
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            下载
          </button>
          <button onClick={handleShare} style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #c9a84c, #a07830)',
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(201,168,76,0.3)',
          }}>
            发送到
          </button>
          <button onClick={onClose} style={{
            padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(230,210,170,0.4)',
            fontSize: 14, cursor: 'pointer',
          }}>
            关闭
          </button>
        </div>
      )}
    </div>
  );
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

  return new Promise(resolve => {
    c.toBlob(blob => {
      if (!blob) return resolve(null);
      resolve(URL.createObjectURL(blob));
    }, 'image/png', 1.0);
  });
}
