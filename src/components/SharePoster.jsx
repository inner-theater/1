import React from 'react';
import QRCode from 'qrcode';

// AI生成的完整海报底图（包含：标题、剧场场景、五幕剧、slogan）
const POSTER_BG = './images/A_vertical_poster_design_for_a_2026-06-18T06-48-58.png';

export default function SharePoster({ visible, onClose }) {
  const [generating, setGenerating] = React.useState(false);

  if (!visible) return null;

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generatePoster();
    } catch (e) {
      console.error('Poster generation failed:', e);
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  }

  async function generatePoster() {
    const W = 750;
    const H = 1334;

    // 1. 加载背景图
    const bgImage = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = POSTER_BG;
    });

    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    // 2. 绘制背景图（cover模式居中裁切）
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

    // 3. 右下角暗化区域覆盖水印 + 放置二维码
    const qrSize = 100;
    const qrMargin = 24;
    const qrX = W - qrSize - qrMargin;
    const qrY = H - qrSize - qrMargin;

    // 二维码白底圆角卡片
    const cardR = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, cardR);
    ctx.fill();

    // 生成并绘制二维码
    const qrDataUrl = await generateQR(window.location.origin || 'https://inner-theater.github.io/1/', { size: qrSize });
    const qrImg = await new Promise((resolve, reject) => {
      const qri = new Image();
      qri.onload = () => resolve(qri);
      qri.onerror = reject;
      qri.src = qrDataUrl;
    });
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // 4. 导出
    c.toBlob(blob => {
      if (!blob) return alert('生成失败');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `内心剧场_分享海报.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png', 1.0);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1410, #0d0a08)',
        borderRadius: 16, padding: '36px 40px',
        textAlign: 'center', maxWidth: 340,
        border: '1px solid rgba(200,160,80,0.15)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(180,130,50,0.08)',
        color: '#e8d8c0'
      }} onClick={e => e.stopPropagation()}>
        {/* 剧场图标 */}
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700,
          background: 'linear-gradient(135deg, #e8c87a 0%, #c9a84c 50%, #dfc06f 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          内心剧场
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: 'rgba(230,210,170,0.45)', lineHeight: 1.6 }}>
          五幕心理剧 · 每一幕都是与自己的对话<br />
          生成专属分享海报
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
            background: generating ? 'rgba(201,168,76,0.3)' : 'linear-gradient(135deg, #c9a84c, #a07830)',
            color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: generating ? 'not-allowed' : 'pointer',
            letterSpacing: '3px',
            boxShadow: '0 6px 25px rgba(201,168,76,0.25)',
            opacity: generating ? 0.7 : 1,
            transition: 'all 0.3s',
          }}
        >
          {generating ? '正在生成...' : '生成海报'}
        </button>
        <button
          onClick={onClose}
          style={{
            marginTop: 14, padding: '8px 0', width: '100%', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
            color: 'rgba(230,210,170,0.35)', fontSize: 13, cursor: 'pointer',
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
