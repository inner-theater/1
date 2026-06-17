import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateInsight } from '../utils/ai-insight';

export default function InsightPanel({ gameType, context, visible }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !gameType || !context) return;

    let cancelled = false;
    setLoading(true);
    setInsight(null);

    generateInsight(gameType, context)
      .then((text) => {
        if (!cancelled && text) {
          setInsight(text);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [gameType, visible, JSON.stringify(context)]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          marginTop: '20px',
          padding: '24px',
          borderRadius: '12px',
          background: 'rgba(26,10,46,0.7)',
          border: '1px solid rgba(96,165,250,0.2)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>🧠</span>
          <span style={{
            fontSize: '13px',
            color: '#60a5fa',
            letterSpacing: '2px',
            fontFamily: 'var(--font-display)',
          }}>
            深度解读
            <span style={{ marginLeft: '6px', fontSize: '10px', color: 'rgba(96,165,250,0.5)' }}>
              AI 实时分析
            </span>
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: '16px' }}>⏳</motion.span>
            AI 正在深度分析你的选择...
          </div>
        ) : insight ? (
          <div style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '14px',
            lineHeight: 1.9,
            whiteSpace: 'pre-wrap',
          }}>
            {insight}
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
