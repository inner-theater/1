import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateInsight } from '../utils/ai-insight';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarConfigById } from '../utils/profile';

export default function InsightPanel({ gameType, context, visible }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (!visible || !gameType || !context) return;

    let cancelled = false;
    setLoading(true);
    setInsight(null);

    // Merge profile info into context for personalized analysis
    const avatarCfg = profile?.avatar ? getAvatarConfigById(profile.avatar) : null;
    const enrichedContext = {
      ...context,
      profile: {
        nickname: profile?.nickname || '',
        gender: profile?.gender || '',
        avatar: profile?.avatar || '',
        avatarLabel: avatarCfg?.label || '',
      },
    };

    generateInsight(gameType, enrichedContext)
      .then((text) => {
        if (!cancelled && text) { setInsight(text); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [gameType, visible, JSON.stringify(context), profile]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, maxHeight: 0, marginTop: 0 }}
        animate={{ opacity: 1, maxHeight: 'min(600px, 70vh)', marginTop: 20 }}
        exit={{ opacity: 0, maxHeight: 0, marginTop: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'rgba(26,10,46,0.7)',
          border: '1px solid rgba(96,165,250,0.2)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>🧠</span>
          <span style={{ fontSize: '13px', color: '#60a5fa', letterSpacing: '2px', fontFamily: 'var(--font-display)' }}>
            深度解读
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: '16px' }}>⏳</motion.span>
            AI 正在深度分析你的选择...
          </div>
        ) : insight ? (
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0 }}>
            {insight}
          </p>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
