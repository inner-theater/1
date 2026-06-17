import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import storage from '../utils/storage';

export default function DecisionDiary() {
  const [diary, setDiary] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setDiary(storage.getDiary());
  }, []);

  const groupByMonth = (entries) => {
    const groups = {};
    entries.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  };

  const clearDiary = () => {
    if (window.confirm('确定要清空所有决策日记吗？')) {
      storage.set('diary', []);
      setDiary([]);
    }
  };

  const grouped = groupByMonth(diary);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>📖</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            决策日记
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            记录每一次选择，绘制你的内心地图
          </p>
        </div>

        {diary.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(35,20,56,0.5)',
            borderRadius: '16px',
            border: '1px dashed rgba(201,168,76,0.2)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
              还没有记录任何决策<br />去剧场大厅玩一个游戏吧
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 28px',
                borderRadius: '10px',
                background: 'rgba(201,168,76,0.2)',
                color: '#c9a84c',
                border: '1px solid rgba(201,168,76,0.3)',
                fontSize: '14px',
              }}
            >
              去剧场大厅 →
            </button>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([month, entries]) => (
              <motion.div
                key={month}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '32px' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{ width: '24px', height: '1px', background: '#c9a84c' }} />
                  <h3 style={{
                    fontSize: '16px',
                    fontFamily: 'var(--font-display)',
                    color: '#e8d48b',
                    letterSpacing: '3px',
                  }}>
                    {month}
                  </h3>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.1)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      whileHover={{ x: 4 }}
                      style={{
                        padding: '20px 24px',
                        borderRadius: '12px',
                        background: 'rgba(35,20,56,0.6)',
                        border: '1px solid rgba(201,168,76,0.15)',
                        borderLeft: '3px solid #c9a84c',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{
                            fontSize: '12px',
                            color: '#c9a84c',
                            letterSpacing: '2px',
                            marginBottom: '6px',
                          }}>
                            🎭 {entry.game}
                          </div>
                          <p style={{ color: '#f5e6d3', fontSize: '15px', marginBottom: '8px' }}>
                            {entry.question || '记录了一次选择'}
                          </p>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                            {entry.result
                              ? Array.isArray(entry.result)
                                ? `底线：${entry.result.join('、')}`
                                : entry.result
                              : ''}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.3)',
                          whiteSpace: 'nowrap',
                        }}>
                          {new Date(entry.timestamp).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                onClick={clearDiary}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  background: 'rgba(192,57,43,0.1)',
                  color: '#e74c3c',
                  border: '1px solid rgba(192,57,43,0.2)',
                  fontSize: '13px',
                }}
              >
                清空日记
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
