import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import storage from '../utils/storage';
import InsightPanel from '../components/InsightPanel';

export default function Game4_ReverseFear() {
  const [step, setStep] = useState('input');
  const [question, setQuestion] = useState('');
  const [fears, setFears] = useState([]);
  const [newFear, setNewFear] = useState('');
  const [removedFears, setRemovedFears] = useState([]);
  const [showFinal, setShowFinal] = useState(false);

  const addFear = () => {
    if (newFear.trim() && fears.length < 10) {
      setFears([...fears, { id: Date.now(), text: newFear.trim(), removed: false }]);
      setNewFear('');
    }
  };

  const removeFear = (id) => {
    const fear = fears.find((f) => f.id === id);
    if (fear && !fear.removed) {
      setFears(fears.map((f) => (f.id === id ? { ...f, removed: true } : f)));
      setRemovedFears([...removedFears, fear]);
    }
  };

  const undoRemove = (id) => {
    setFears(fears.map((f) => (f.id === id ? { ...f, removed: false } : f)));
    setRemovedFears(removedFears.filter((f) => f.id !== id));
  };

  const revealAnswer = () => {
    setShowFinal(true);
    const remaining = fears.filter((f) => !f.removed);
    storage.addDiaryEntry({
      game: '反向恐惧清单',
      question,
      result: remaining.map((f) => f.text),
      type: 'reverse-fear',
    });
  };

  const resetGame = () => {
    setStep('input');
    setFears([]);
    setRemovedFears([]);
    setShowFinal(false);
    setQuestion('');
    setNewFear('');
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>🃏</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            反向恐惧清单
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            删掉你能承受的坏结果，最后留下的就是你的底线
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
                你正在面临什么决定？
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="比如：要不要考研？"
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
                }}
              />

              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '12px', display: 'block' }}>
                列出你害怕发生的最坏结果（最多10个）
              </label>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={newFear}
                  onChange={(e) => setNewFear(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFear()}
                  placeholder="比如：考不上浪费一年时间"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(201,168,76,0.25)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={addFear}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    background: 'rgba(201,168,76,0.2)',
                    color: '#c9a84c',
                    border: '1px solid rgba(201,168,76,0.3)',
                  }}
                >
                  添加
                </button>
              </div>

              {fears.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                  {fears.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: 'rgba(192,57,43,0.15)',
                        border: '1px solid rgba(192,57,43,0.3)',
                        color: '#e74c3c',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{f.text}</span>
                      <button
                        onClick={() => setFears(fears.filter((x) => x.id !== f.id))}
                        style={{
                          background: 'none',
                          color: '#e74c3c',
                          fontSize: '16px',
                          padding: '0 2px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => fears.length >= 2 && setStep('removing')}
                disabled={fears.length < 2 || !question.trim()}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  background: fears.length >= 2 && question.trim()
                    ? 'linear-gradient(135deg, #c9a84c, #e8d48b)'
                    : 'rgba(255,255,255,0.1)',
                  color: fears.length >= 2 && question.trim() ? '#1a0a2e' : 'rgba(255,255,255,0.3)',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  letterSpacing: '3px',
                  cursor: fears.length >= 2 && question.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                开始删除你能承受的
              </button>
            </motion.div>
          )}

          {step === 'removing' && (
            <motion.div
              key="removing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div style={{
                background: 'rgba(35,20,56,0.8)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(201,168,76,0.2)',
              }}>
                <p style={{ textAlign: 'center', color: '#e8d48b', marginBottom: '24px', letterSpacing: '2px' }}>
                  逐一删除你可以承受的最坏结果 — 点击卡片即可删除
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fears.map((fear) => (
                    <motion.div
                      key={fear.id}
                      layout
                      initial={{ opacity: 1, x: 0 }}
                      animate={fear.removed
                        ? { opacity: 0, x: 100, height: 0, margin: 0, padding: 0 }
                        : { opacity: 1, x: 0 }
                      }
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.4 }}
                      onClick={() => fear.removed ? undoRemove(fear.id) : removeFear(fear.id)}
                      style={{
                        padding: fear.removed ? '0' : '16px 20px',
                        borderRadius: '10px',
                        background: fear.removed
                          ? 'transparent'
                          : 'linear-gradient(135deg, rgba(192,57,43,0.2), rgba(192,57,43,0.05))',
                        border: fear.removed
                          ? 'none'
                          : '1px solid rgba(192,57,43,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s',
                      }}
                      whileHover={!fear.removed ? { scale: 1.02 } : {}}
                    >
                      {!fear.removed && (
                        <>
                          <span style={{ color: '#f5e6d3', fontSize: '15px' }}>{fear.text}</span>
                          <span style={{ color: '#e74c3c', fontSize: '13px' }}>点击删除 →</span>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Removed fears */}
                {removedFears.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>
                      已删除（点击恢复）：
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {removedFears.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => undoRemove(f.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '12px',
                            textDecoration: 'line-through',
                          }}
                        >
                          {f.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!showFinal && (
                  <button
                    onClick={revealAnswer}
                    disabled={fears.filter((f) => !f.removed).length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      marginTop: '24px',
                      background: fears.filter((f) => !f.removed).length > 0
                        ? 'linear-gradient(135deg, #059669, #10b981)'
                        : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      letterSpacing: '3px',
                      cursor: fears.filter((f) => !f.removed).length > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    揭晓你的底线
                  </button>
                )}
              </div>

              {/* Final result */}
              <AnimatePresence>
                {showFinal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      background: 'rgba(35,20,56,0.9)',
                      borderRadius: '16px',
                      border: '2px solid #c9a84c',
                      marginTop: '24px',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.8 }}
                      style={{ fontSize: '64px', marginBottom: '16px' }}
                    >
                      💎
                    </motion.div>
                    <h3 style={{ fontSize: '20px', color: '#e8d48b', letterSpacing: '2px', marginBottom: '16px' }}>
                      这是你无论如何都无法接受的结果：
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                      {fears.filter((f) => !f.removed).map((f) => (
                        <div
                          key={f.id}
                          style={{
                            padding: '14px 24px',
                            background: 'rgba(192,57,43,0.2)',
                            borderRadius: '10px',
                            color: '#e74c3c',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: '1px solid rgba(192,57,43,0.4)',
                            maxWidth: '400px',
                          }}
                        >
                          {f.text}
                        </div>
                      ))}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '16px', fontSize: '14px' }}>
                      回避这些，就是你做选择的第一原则。
                    </p>

                    <button
                      onClick={resetGame}
                      style={{
                        padding: '12px 28px',
                        borderRadius: '10px',
                        background: 'rgba(201,168,76,0.2)',
                        color: '#c9a84c',
                        marginTop: '20px',
                        border: '1px solid rgba(201,168,76,0.3)',
                        fontSize: '14px',
                      }}
                    >
                      重新开始
                    </button>

                    <InsightPanel
                      gameType="reverse-fear"
                      visible={true}
                      context={{
                        question,
                        allFears: [...fears, ...removedFears].map((f) => f.label || f).join('、'),
                        kept: fears.map((f) => f.label || f).join('、'),
                        removed: removedFears.map((f) => f.label || f).join('、'),
                        interactions: `用户写入了${fears.length + removedFears.length}个恐惧项，删除了${removedFears.length}个`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
