import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import storage from '../utils/storage';
import InsightPanel from '../components/InsightPanel';

const VALUES = [
  { id: 1, name: '自由', icon: '🕊️', description: '不被束缚，想做什么就做什么' },
  { id: 2, name: '爱与被爱', icon: '💕', description: '拥有温暖的亲密关系' },
  { id: 3, name: '成就', icon: '🏆', description: '事业成功，获得认可' },
  { id: 4, name: '安全感', icon: '🏠', description: '生活稳定，衣食无忧' },
  { id: 5, name: '创造力', icon: '🎨', description: '用创造表达自我' },
  { id: 6, name: '冒险', icon: '🧗', description: '体验新鲜刺激的人生' },
  { id: 7, name: '智慧', icon: '📚', description: '不断学习和成长' },
  { id: 8, name: '健康', icon: '💪', description: '身心健康，精力充沛' },
  { id: 9, name: '影响力', icon: '🌟', description: '能影响和帮助他人' },
  { id: 10, name: '宁静', icon: '🧘', description: '内心平和，不急不躁' },
  { id: 11, name: '财富', icon: '💰', description: '经济自由，不愁钱' },
  { id: 12, name: '家庭', icon: '👨‍👩‍👧‍👦', description: '和睦的家庭生活' },
];

export default function Game5_ValueAuction() {
  const [step, setStep] = useState('input');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [auction, setAuction] = useState('bidding');
  const [gold, setGold] = useState(100);
  const [currentBid, setCurrentBid] = useState(0);
  const [currentValueIdx, setCurrentValueIdx] = useState(0);
  const [bids, setBids] = useState({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [matchedOption, setMatchedOption] = useState(-1);

  const startAuction = () => {
    const validOpts = options.filter((o) => o.trim());
    if (validOpts.length < 2 || !question.trim()) return;
    setStep('auction');
    setBids({});
    setGold(100);
    setCurrentValueIdx(0);
    setCurrentBid(0);
    setTotalSpent(0);
  };

  const placeBid = (amount) => {
    if (amount <= 0 || amount > gold) return;
    const value = VALUES[currentValueIdx];
    setBids({ ...bids, [value.id]: amount });
    setGold(gold - amount);
    setTotalSpent(totalSpent + amount);

    if (currentValueIdx < VALUES.length - 1) {
      setCurrentValueIdx(currentValueIdx + 1);
      setCurrentBid(0);
    } else {
      // Auction complete
      calculateResult();
    }
  };

  const skipValue = () => {
    if (currentValueIdx < VALUES.length - 1) {
      setCurrentValueIdx(currentValueIdx + 1);
      setCurrentBid(0);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    // Match values to options
    const valueMap = {
      '自由': ['自由', '冒险', '创造力'],
      '爱与被爱': ['爱与被爱', '家庭', '宁静'],
      '成就': ['成就', '影响力', '财富'],
      '安全感': ['安全感', '健康', '家庭'],
      '创造力': ['创造力', '自由', '智慧'],
      '冒险': ['冒险', '自由', '创造力'],
      '智慧': ['智慧', '成就', '宁静'],
      '健康': ['健康', '宁静', '家庭'],
      '影响力': ['影响力', '成就', '财富'],
      '宁静': ['宁静', '健康', '家庭'],
      '财富': ['财富', '安全感', '成就'],
      '家庭': ['家庭', '爱与被爱', '安全感'],
    };

    const optionWeights = options.map((opt) => {
      let score = 0;
      Object.entries(bids).forEach(([valueId, bidAmount]) => {
        const value = VALUES.find((v) => v.id === parseInt(valueId));
        if (value && valueMap[value.name]) {
          // Simple keyword matching
          valueMap[value.name].forEach((keyword) => {
            if (opt.toLowerCase().includes(keyword.toLowerCase())) {
              score += bidAmount;
            }
          });
          // Give some score even without match
          score += bidAmount * 0.1;
        }
      });
      return { opt, score };
    });

    const maxScore = Math.max(...optionWeights.map((o) => o.score));
    const winner = optionWeights.findIndex((o) => o.score === maxScore);

    setMatchedOption(winner);
    setShowResult(true);

    storage.addDiaryEntry({
      game: '价值天平拍卖会',
      question,
      options,
      bids,
      result: options[winner],
      type: 'value-auction',
    });
  };

  const resetGame = () => {
    setStep('input');
    setBids({});
    setGold(100);
    setCurrentValueIdx(0);
    setShowResult(false);
    setMatchedOption(-1);
    setQuestion('');
    setOptions(['', '']);
  };

  const progressPercent = VALUES.length > 0 ? (currentValueIdx / VALUES.length) * 100 : 0;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>⚖️</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            价值天平拍卖会
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            用100枚金币竞拍你珍视的价值，让选择回归理性
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ background: 'rgba(35,20,56,0.8)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(201,168,76,0.2)' }}>
              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '8px', display: 'block' }}>
                你正在做什么决定？
              </label>
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="比如：选哪个 offer？"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', outline: 'none', marginBottom: '20px' }} />

              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '12px', display: 'block' }}>
                你的选项
              </label>
              {options.map((opt, i) => (
                <input key={i} type="text" value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                  placeholder={`选项 ${i + 1}`}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '10px' }} />
              ))}

              <button onClick={startAuction} disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', marginTop: '8px',
                  background: question.trim() && options.filter((o) => o.trim()).length >= 2 ? 'linear-gradient(135deg, #c9a84c, #e8d48b)' : 'rgba(255,255,255,0.1)',
                  color: question.trim() && options.filter((o) => o.trim()).length >= 2 ? '#1a0a2e' : 'rgba(255,255,255,0.3)',
                  fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px',
                  cursor: question.trim() && options.filter((o) => o.trim()).length >= 2 ? 'pointer' : 'not-allowed' }}>
                进入拍卖大厅
              </button>
            </motion.div>
          )}

          {step === 'auction' && (
            <motion.div key="auction" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Gold display */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>💰</span>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#e8d48b', fontFamily: 'var(--font-display)' }}>
                    {gold}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>枚金币剩余</span>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${progressPercent}%` }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #c9a84c, #e8d48b)', borderRadius: '4px' }}
                  />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '6px' }}>
                  {currentValueIdx}/{VALUES.length}
                </p>
              </div>

              {!showResult && currentValueIdx < VALUES.length && (
                <motion.div
                  key={currentValueIdx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: 'rgba(35,20,56,0.8)',
                    borderRadius: '16px',
                    padding: '32px',
                    border: '1px solid rgba(201,168,76,0.2)',
                    textAlign: 'center',
                  }}
                >
                  {/* Value card */}
                  <div style={{ fontSize: '64px', marginBottom: '12px' }}>
                    {VALUES[currentValueIdx].icon}
                  </div>
                  <h3 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '3px', marginBottom: '8px' }}>
                    {VALUES[currentValueIdx].name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>
                    {VALUES[currentValueIdx].description}
                  </p>

                  {/* Bid buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    {[1, 5, 10, 15, 20, 25].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => placeBid(amount)}
                        disabled={amount > gold}
                        style={{
                          padding: '14px 8px',
                          borderRadius: '10px',
                          background: amount > gold
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(201,168,76,0.15)',
                          border: amount > gold
                            ? '1px solid rgba(255,255,255,0.05)'
                            : '1px solid rgba(201,168,76,0.3)',
                          color: amount > gold ? 'rgba(255,255,255,0.2)' : '#e8d48b',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: amount > gold ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '18px' }}>🪙×{amount}</div>
                        <div style={{ fontSize: '11px', color: amount > gold ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}>
                          {amount} 金币
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={skipValue}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '13px',
                    }}
                  >
                    跳过此价值 →
                  </button>

                  {/* Current bids */}
                  {Object.keys(bids).length > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                      {Object.entries(bids).map(([vid, amount]) => {
                        const v = VALUES.find((x) => x.id === parseInt(vid));
                        return v ? (
                          <div key={vid} style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(201,168,76,0.1)',
                            border: '1px solid rgba(201,168,76,0.2)',
                            fontSize: '12px',
                            color: '#e8d48b',
                          }}>
                            {v.icon} {v.name}: 🪙×{amount}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Result */}
              <AnimatePresence>
                {showResult && (
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
                    }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.8 }}
                      style={{ fontSize: '64px', marginBottom: '16px' }}
                    >
                      ⚖️
                    </motion.div>
                    <h3 style={{ fontSize: '20px', color: '#e8d48b', letterSpacing: '2px', marginBottom: '16px' }}>
                      你的价值观天平倾向于：
                    </h3>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#fff',
                      padding: '16px 32px',
                      background: 'rgba(201,168,76,0.1)',
                      borderRadius: '12px',
                      display: 'inline-block',
                      marginBottom: '24px',
                    }}>
                      {matchedOption >= 0 ? options[matchedOption] : '无法判断'}
                    </div>

                    {/* Values breakdown */}
                    <div style={{ textAlign: 'left', marginTop: '16px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>
                        你拍下的价值
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                        {Object.entries(bids).sort(([, a], [, b]) => b - a).slice(0, 5).map(([vid, amount]) => {
                          const v = VALUES.find((x) => x.id === parseInt(vid));
                          return v ? (
                            <div key={vid} style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              background: 'rgba(201,168,76,0.1)',
                              border: '1px solid rgba(201,168,76,0.2)',
                              fontSize: '13px',
                              color: '#e8d48b',
                            }}>
                              {v.icon} {v.name} ({amount}金币)
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <button onClick={resetGame}
                      style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)', fontSize: '14px', marginTop: '24px' }}>
                      重新开始
                    </button>

                    <InsightPanel
                      gameType="value-auction"
                      visible={true}
                      data={{
                        question,
                        bids,
                        result: matchedOption >= 0 ? options[matchedOption] : '',
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
