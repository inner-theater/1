import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFutureLetter } from '../utils/ai';
import storage from '../utils/storage';
import InsightPanel from '../components/InsightPanel';
import { useAuth } from '../contexts/AuthContext';

export default function Game2_ParallelLetters() {
  const [step, setStep] = useState('input');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [letters, setLetters] = useState(null);
  const [letterMeta, setLetterMeta] = useState(null); // { chosen, other }
  const [loading, setLoading] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [highlights, setHighlights] = useState({});
  const { profile } = useAuth();

  const generateLetters = async () => {
    if (!optionA.trim() || !optionB.trim()) return;
    setLoading(true);
    try {
      const { letters: letterList, chosen, other } = await generateFutureLetter(optionA, optionB, {
        nickname: profile?.nickname || '',
        gender: profile?.gender || '',
      });
      setLetters(letterList);
      setLetterMeta({ chosen, other });
      setStep('letters');
      storage.addDiaryEntry({
        game: '平行时空来信',
        optionA,
        optionB,
        chosen,
        other,
        type: 'parallel-letters',
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleHighlight = (letterIdx, sentence) => {
    const key = `${letterIdx}-${sentence.slice(0, 20)}`;
    setHighlights((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>✉️</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            平行时空来信
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            AI 为你写下不同选择后的未来信件，感受时间带来的回响
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                background: 'rgba(35,20,56,0.8)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '8px', display: 'block' }}>
                选项 A
              </label>
              <textarea
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="比如：去大城市打拼"
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(201,168,76,0.3)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '16px',
                  resize: 'vertical',
                }}
              />

              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <span style={{ color: '#c9a84c', fontSize: '24px' }}>⚡ VS ⚡</span>
              </div>

              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '8px', display: 'block' }}>
                选项 B
              </label>
              <textarea
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="比如：回老家过安稳日子"
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(201,168,76,0.3)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '24px',
                  resize: 'vertical',
                }}
              />

              <button
                onClick={generateLetters}
                disabled={!optionA.trim() || !optionB.trim() || loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  background: optionA.trim() && optionB.trim() && !loading
                    ? 'linear-gradient(135deg, #c9a84c, #e8d48b)'
                    : 'rgba(255,255,255,0.1)',
                  color: optionA.trim() && optionB.trim() && !loading ? '#1a0a2e' : 'rgba(255,255,255,0.3)',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  letterSpacing: '3px',
                  cursor: optionA.trim() && optionB.trim() && !loading ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      style={{ display: 'inline-block', fontSize: '20px' }}
                    >
                      ⏳
                    </motion.span>
                    AI 正在穿越时空写信...
                  </span>
                ) : (
                  '召唤未来来信'
                )}
              </button>
            </motion.div>
          )}

          {step === 'letters' && letters && (
            <motion.div
              key="letters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}>
                {letters.map((letter, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    onClick={() => setSelectedLetter(idx)}
                    style={{
                      padding: '24px',
                      borderRadius: '14px',
                      background: selectedLetter === idx
                        ? 'rgba(201,168,76,0.15)'
                        : 'rgba(35,20,56,0.8)',
                      border: selectedLetter === idx
                        ? '2px solid #c9a84c'
                        : '1px solid rgba(201,168,76,0.2)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {['📮', '✉️', '💝'][idx]}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontFamily: 'var(--font-display)',
                      color: '#e8d48b',
                      letterSpacing: '2px',
                      marginBottom: '4px',
                    }}>
                      {letter.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.4)',
                    }}>
                      点击阅读
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Selected letter content */}
              <AnimatePresence>
                {selectedLetter !== null && letters[selectedLetter] && (
                  <motion.div
                    key="letter-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background: 'rgba(35,20,56,0.9)',
                      borderRadius: '16px',
                      padding: '36px',
                      border: '2px solid rgba(201,168,76,0.3)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* Decorative envelope */}
                    <div style={{
                      position: 'absolute',
                      top: 0, right: 0,
                      width: '80px', height: '80px',
                      background: 'linear-gradient(135deg, transparent 50%, rgba(201,168,76,0.1) 50%)',
                      borderBottomLeftRadius: '16px',
                    }} />

                    <h3 style={{
                      fontSize: '24px',
                      fontFamily: 'var(--font-display)',
                      color: '#e8d48b',
                      textAlign: 'center',
                      marginBottom: '24px',
                      letterSpacing: '3px',
                    }}>
                      {letters[selectedLetter].title}
                    </h3>

                    <div style={{
                      fontSize: '15px',
                      lineHeight: 2,
                      color: 'rgba(255,255,255,0.85)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {letters[selectedLetter].content.split('。').map((sentence, si) => {
                        if (!sentence.trim()) return null;
                        const key = `${selectedLetter}-${sentence.slice(0, 20)}`;
                        return (
                          <span key={si}>
                            <span
                              onClick={() => toggleHighlight(selectedLetter, sentence)}
                              style={{
                                background: highlights[key] ? 'rgba(201,168,76,0.3)' : 'transparent',
                                borderRadius: '4px',
                                padding: '1px 4px',
                                cursor: 'pointer',
                                transition: 'background 0.3s',
                                marginRight: '2px',
                              }}
                              title="点击标记触动你的句子"
                            >
                              {sentence}
                            </span>
                             。
                          </span>
                        );
                      })}
                    </div>

                    <p style={{
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.35)',
                      fontSize: '12px',
                      marginTop: '24px',
                    }}>
                      点击句子可以标记触动你的内容
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <button
                  onClick={() => { setStep('input'); setLetters(null); setLetterMeta(null); setSelectedLetter(null); setHighlights({}); }}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '10px',
                    background: 'rgba(201,168,76,0.2)',
                    color: '#c9a84c',
                    border: '1px solid rgba(201,168,76,0.3)',
                    fontSize: '14px',
                  }}
                >
                  重新选择
                </button>

                <InsightPanel
                  gameType="parallel-letters"
                  visible={true}
                  context={{
                    optionA,
                    optionB,
                    chosen: letterMeta?.chosen || '',
                    other: letterMeta?.other || '',
                    highlights: Object.keys(highlights || {}).join('、'),
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
