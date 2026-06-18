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

async function generatePoster() {
  const W = 750, H = 1334;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const C = W / 2;
  const M = 56; // margin

  // ===== 背景：深黑绒布质感 =====
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0c0a08');
  bg.addColorStop(0.5, '#080604');
  bg.addColorStop(1, '#040302');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ===== 中上方的暖光氛围 =====
  const glow = ctx.createRadialGradient(C, 240, 30, C, 320, 380);
  glow.addColorStop(0, 'rgba(180,140,60,0.10)');
  glow.addColorStop(0.5, 'rgba(150,110,40,0.03)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 600);

  // ===== 金色双层边框 =====
  const bm = 30; // border margin
  ctx.strokeStyle = 'rgba(180,140,60,0.18)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(bm, bm, W - bm * 2, H - bm * 2);
  ctx.strokeStyle = 'rgba(180,140,60,0.12)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(bm + 10, bm + 10, W - (bm + 10) * 2, H - (bm + 10) * 2);

  // ===== 四角装饰 =====
  const dd = 18, dl = 40;
  ctx.strokeStyle = 'rgba(200,160,80,0.20)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(bm + dd, bm + dd, dl, dl);
  ctx.strokeRect(W - bm - dd - dl, bm + dd, dl, dl);
  ctx.strokeRect(bm + dd, H - bm - dd - dl, dl, dl);
  ctx.strokeRect(W - bm - dd - dl, H - bm - dd - dl, dl, dl);

  // ===== 顶部星点装饰 =====
  ctx.fillStyle = 'rgba(200,160,80,0.25)';
  const topStars = [
    [C - 160, 115], [C - 60, 95], [C + 60, 95], [C + 160, 115],
    [C - 240, 135], [C + 240, 135], [C, 72],
  ];
  for (const [sx, sy] of topStars) {
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== 上方装饰线 =====
  ctx.strokeStyle = 'rgba(200,160,80,0.14)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(C - 120, 128);
  ctx.lineTo(C - 15, 128);
  ctx.moveTo(C + 15, 128);
  ctx.lineTo(C + 120, 128);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,160,80,0.22)';
  ctx.beginPath();
  ctx.arc(C, 128, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // ===== 标题区 =====
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 英文 theatre name
  ctx.fillStyle = 'rgba(180,140,80,0.30)';
  ctx.font = '10px "Georgia", serif';
  ctx.fillText('A  PSYCHOLOGICAL  THEATER', C, 155);

  // "内心剧场"
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  const tg = ctx.createLinearGradient(0, 195, 0, 295);
  tg.addColorStop(0, '#eddaa0');
  tg.addColorStop(0.3, '#fff5d8');
  tg.addColorStop(0.5, '#faf0c8');
  tg.addColorStop(0.7, '#e8d090');
  tg.addColorStop(1, '#c49a40');
  ctx.fillStyle = tg;
  ctx.font = 'bold 86px "STKaiti", "KaiTi", "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.fillText('内心剧场', C, 248);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 英文 subtitle
  ctx.fillStyle = 'rgba(200,160,80,0.22)';
  ctx.font = 'italic 12px "Georgia", serif';
  ctx.fillText('T H E   I N N E R   T H E A T E R', C, 315);

  // 分隔
  ctx.strokeStyle = 'rgba(180,140,60,0.16)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(M + 60, 345);
  ctx.lineTo(W - M - 60, 345);
  ctx.stroke();

  // slogan
  ctx.fillStyle = 'rgba(240,225,200,0.75)';
  ctx.font = '19px "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.fillText('在你纠结时，听见心底的声音', C, 385);

  // 第二分隔线
  ctx.strokeStyle = 'rgba(180,140,60,0.10)';
  ctx.beginPath();
  ctx.moveTo(M + 60, 415);
  ctx.lineTo(W - M - 60, 415);
  ctx.stroke();

  // ===== 五幕剧 =====
  const acts = [
    { no: '第 一 幕', title: '本能之手', icon: '✋', desc: '光球飘舞 · 感官先行 · 3 秒抉择' },
    { no: '第 二 幕', title: '反向恐惧清单', icon: '📝', desc: '删去杂音 · 剥开焦虑 · 找到底线' },
    { no: '第 三 幕', title: '平行时空来信', icon: '✉️', desc: '另一条人生轨迹 · AI 亲笔信笺' },
    { no: '第 四 幕', title: '朋友灵魂拷问室', icon: '👥', desc: '借朋友的镜子 · 照见真实的自己' },
    { no: '第 五 幕', title: '价值天平拍卖会', icon: '⚖️', desc: '100 枚金币 · 竞标你的价值排序' },
  ];

  const actY0 = 470;
  const actH = 100;

  acts.forEach((act, i) => {
    const y0 = actY0 + i * actH;
    const cy = y0 + actH / 2;

    // 幕次背景 - 微妙的暗色块
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.012)';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.008)';
    }
    ctx.fillRect(M + 40, y0 + 5, W - (M + 40) * 2, actH - 10);

    // 幕次编号
    ctx.fillStyle = 'rgba(200,160,80,0.28)';
    ctx.font = '10px "Georgia", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.fillText(act.no, M + 75, cy);

    // 竖线
    ctx.strokeStyle = 'rgba(200,160,80,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(M + 110, cy - 22);
    ctx.lineTo(M + 110, cy + 22);
    ctx.stroke();

    // 图标
    ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.fillText(act.icon, M + 140, cy);

    // 游戏名称
    ctx.fillStyle = 'rgba(240,225,205,0.92)';
    ctx.font = 'bold 18px "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(act.title, M + 175, cy - 12);

    // 描述
    ctx.fillStyle = 'rgba(180,155,130,0.50)';
    ctx.font = '13px "PingFang SC", sans-serif';
    ctx.fillText(act.desc, M + 175, cy + 16);

    // 底部微线
    if (i < acts.length - 1) {
      ctx.strokeStyle = 'rgba(180,140,60,0.07)';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(M + 100, y0 + actH);
      ctx.lineTo(W - M - 100, y0 + actH);
      ctx.stroke();
    }
  });

  ctx.textAlign = 'center';

  // ===== 底部装饰线 =====
  const botLineY = actY0 + 5 * actH + 35;
  ctx.strokeStyle = 'rgba(180,140,60,0.15)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(M + 60, botLineY);
  ctx.lineTo(C - 12, botLineY);
  ctx.moveTo(C + 12, botLineY);
  ctx.lineTo(W - M - 60, botLineY);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,160,80,0.20)';
  ctx.beginPath();
  ctx.arc(C, botLineY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 底部文字
  ctx.fillStyle = 'rgba(200,180,150,0.45)';
  ctx.font = '14px "PingFang SC", sans-serif';
  ctx.fillText('五幕心理剧 · 每一幕，都是与自己的对话', C, botLineY + 40);

  // ===== 底部区域暗化 =====
  const bd = ctx.createLinearGradient(0, H - 260, 0, H);
  bd.addColorStop(0, 'rgba(4,3,2,0)');
  bd.addColorStop(0.5, 'rgba(4,3,2,0.65)');
  bd.addColorStop(1, 'rgba(4,3,2,0.92)');
  ctx.fillStyle = bd;
  ctx.fillRect(0, H - 260, W, 260);

  // ===== 右下角二维码 =====
  const qrSize = 88;
  const qrX = W - qrSize - 48;
  const qrY = H - qrSize - 60;

  ctx.fillStyle = '#f9f5ed';
  drawRR(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 8);
  ctx.fill();

  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    width: qrSize * 2,
    margin: 1,
    color: { dark: '#1a1a1a', light: '#f9f5ed' },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // ===== 底部收尾 =====
  ctx.fillStyle = 'rgba(160,140,110,0.28)';
  ctx.font = '11px "PingFang SC", sans-serif';
  ctx.fillText('为你心底的五幕演出 · 现在开场', C, H - 26);

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
