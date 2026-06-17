import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateInsight } from '../utils/ai-insight';

export default function InsightPanel({ gameType, data, visible }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromAI, setFromAI] = useState(false);

  useEffect(() => {
    if (!visible || !gameType || !data) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setInsight(null);

    generateInsight(gameType, data)
      .then((text) => {
        if (!cancelled) {
          setInsight(text || '正在为你整理分析...');
          // If the reply doesn't start with "##", it's from AI (not template)
          setFromAI(text && !text.startsWith('## '));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('暂时无法生成分析');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [gameType, visible, data]);

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
            理性解读
            <span style={{ marginLeft: '6px', fontSize: '10px', color: fromAI ? 'rgba(96,165,250,0.7)' : 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
              {fromAI ? 'AI 实时分析' : '专业解读'}
            </span>
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: '16px' }}>⏳</motion.span>
            AI 正在分析你的决策模式...
          </div>
        ) : error ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontStyle: 'italic' }}>{error}</p>
        ) : insight ? (
          <div style={{
            color: 'rgba(255,255,255,0.7)',
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
