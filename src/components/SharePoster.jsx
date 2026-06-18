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

const ACTS = [
  { num: '一', title: '本能之手', sub: 'INTUITION' },
  { num: '二', title: '反向恐惧清单', sub: 'FEAR' },
  { num: '三', title: '平行时空来信', sub: 'FUTURE' },
  { num: '四', title: '朋友灵魂拷问室', sub: 'OTHERS' },
  { num: '五', title: '价值天平拍卖会', sub: 'VALUE' },
  { num: '六', title: '人格测试', sub: 'PERSONALITY' },
];

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

  // 覆盖原五幕文字区域（暗化遮罩，下移到露出人物腿部）
  ctx.fillStyle = 'rgba(26, 8, 6, 0.92)';
  ctx.fillRect(0, 790, W, 544);

  // 画新的五幕文字 —— 垂直时间线风格
  const startY = 830;
  const lineX = W / 2;
  const lineTop = startY - 15;
  const lineBottom = startY + ACTS.length * 72 + 5;

  // 中央时间线
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lineX, lineTop);
  ctx.lineTo(lineX, lineBottom);
  ctx.stroke();

  // 顶部装饰点
  ctx.fillStyle = 'rgba(201, 168, 76, 0.6)';
  ctx.beginPath();
  ctx.arc(lineX, lineTop, 4, 0, Math.PI * 2);
  ctx.fill();

  ACTS.forEach((act, i) => {
    const y = startY + i * 72;
    const isLeft = i % 2 === 0;
    const textX = isLeft ? lineX - 35 : lineX + 35;
    const align = isLeft ? 'right' : 'left';

    // 节点圆点
    ctx.fillStyle = 'rgba(201, 168, 76, 0.9)';
    ctx.beginPath();
    ctx.arc(lineX, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 15, 8, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 连接线到文字
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lineX + (isLeft ? -5 : 5), y);
    ctx.lineTo(textX + (isLeft ? -10 : 10), y);
    ctx.stroke();

    // 幕数标签
    ctx.fillStyle = 'rgba(201, 168, 76, 0.7)';
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = align;
    ctx.fillText(`第${act.num}幕`, textX, y - 8);

    // 标题
    ctx.fillStyle = 'rgba(240, 215, 170, 0.95)';
    ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = align;
    ctx.fillText(act.title, textX, y + 16);

    // 英文小字
    ctx.fillStyle = 'rgba(201, 168, 76, 0.4)';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = align;
    ctx.fillText(act.sub, textX, y + 32);
  });
  // 二维码（右下角）
  const qrSize = 90, qrMargin = 20;
  const qrX = W - qrSize - qrMargin, qrY = H - qrSize - qrMargin;
  const qrCenterY = qrY + qrSize / 2;

  // slogan 与二维码同行（左侧）
  ctx.fillStyle = 'rgba(201, 168, 76, 0.85)';
  ctx.font = '17px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('五个维度，一场与自己的对话', 30, qrCenterY + 5);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8);
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
