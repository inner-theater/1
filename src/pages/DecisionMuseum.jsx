import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import storage from '../utils/storage';

const games = {
  'instinct-hand': '本能之手',
  'parallel-letters': '平行时空来信',
  'friend-room': '朋友灵魂拷问室',
  'reverse-fear': '反向恐惧清单',
  'value-auction': '价值天平拍卖会',
};

const emojis = {
  'instinct-hand': '🤲',
  'parallel-letters': '💌',
  'friend-room': '🔮',
  'reverse-fear': '🃏',
  'value-auction': '⚖️',
};

export default function DecisionMuseum() {
  const [items, setItems] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');

  useEffect(() => {
    setItems(storage.getMuseum());
  }, []);

  const submitToMuseum = () => {
    if (!submitTitle.trim()) return;
    storage.addMuseumItem({
      title: submitTitle,
      description: submitDesc,
      author: '匿名',
    });
    setItems(storage.getMuseum());
    setSubmitTitle('');
    setSubmitDesc('');
    setShowSubmit(false);
  };

  const toggleLike = (id) => {
    storage.toggleMuseumLike(id);
    setItems(storage.getMuseum());
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>🏛️</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            人生决策博物馆
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            每个人都在这里匿名展出一个自己做过的决定<br />或许别人的故事，会给你的选择一些启发
          </p>
        </div>

        {/* Submit section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => setShowSubmit(!showSubmit)}
            style={{
              padding: '12px 28px',
              borderRadius: '10px',
              background: 'rgba(201,168,76,0.2)',
              color: '#c9a84c',
              border: '1px solid rgba(201,168,76,0.3)',
              fontSize: '14px',
            }}
          >
            {showSubmit ? '取消' : '+ 匿名展出一个决定'}
          </button>

          {showSubmit && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              style={{
                marginTop: '16px',
                padding: '24px',
                background: 'rgba(35,20,56,0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(201,168,76,0.2)',
                textAlign: 'left',
              }}
            >
              <input
                type="text"
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
                placeholder="你做了什么决定？"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(201,168,76,0.25)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  marginBottom: '10px',
                }}
              />
              <textarea
                value={submitDesc}
                onChange={(e) => setSubmitDesc(e.target.value)}
                placeholder="这个决定的结果如何？你想对正在面临类似选择的人说什么？"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(201,168,76,0.25)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '12px',
                }}
              />
              <button
                onClick={submitToMuseum}
                disabled={!submitTitle.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  background: submitTitle.trim() ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.05)',
                  color: submitTitle.trim() ? '#e8d48b' : 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  fontSize: '14px',
                }}
              >
                匿名发布
              </button>
            </motion.div>
          )}
        </div>

        {/* Museum exhibits */}
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(35,20,56,0.5)',
            borderRadius: '16px',
            border: '1px dashed rgba(201,168,76,0.2)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏺</div>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              博物馆还是空的<br />做第一个匿名展出的人吧
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(201,168,76,0.2)' }}
                style={{
                  padding: '24px',
                  borderRadius: '14px',
                  background: 'rgba(35,20,56,0.7)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  position: 'relative',
                }}
              >
                {/* Frame decoration */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: '14px',
                  border: '2px solid transparent',
                  borderImage: 'linear-gradient(135deg, rgba(201,168,76,0.3), transparent, rgba(201,168,76,0.3)) 1',
                  pointerEvents: 'none',
                }} />

                <div style={{ fontSize: '14px', color: '#c9a84c', letterSpacing: '2px', marginBottom: '8px' }}>
                  🎭 匿名者的决定
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontFamily: 'var(--font-display)',
                  color: '#f5e6d3',
                  marginBottom: '8px',
                  letterSpacing: '1px',
                }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.7,
                    marginBottom: '16px',
                  }}>
                    {item.description}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                }}>
                  <span>{new Date(item.timestamp).toLocaleDateString('zh-CN')}</span>
                  <button
                    onClick={() => toggleLike(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      color: '#c9a84c',
                      fontSize: '13px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    ❤️ {item.likes || 0}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
