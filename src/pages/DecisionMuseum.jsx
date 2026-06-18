import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

export default function DecisionMuseum() {
  const [items, setItems] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitDesc, setSubmitDesc] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const data = await storage.getMuseum();
    setItems(Array.isArray(data) ? data : []);
    if (user) {
      const liked = await storage.getUserLikesToday();
      setLikedIds(liked);
    }
  };

  const submitToMuseum = async () => {
    if (!submitTitle.trim() || submitLoading) return;
    if (!user) {
      alert('请先登录后再发布');
      return;
    }
    setSubmitLoading(true);
    try {
      await storage.addMuseumItem(submitTitle.trim(), submitDesc.trim());
      setSubmitTitle('');
      setSubmitDesc('');
      setShowSubmit(false);
      await loadItems();
    } catch (e) {
      alert('发布失败，请稍后再试');
    }
    setSubmitLoading(false);
  };

  const handleLike = async (itemId) => {
    if (!user) {
      alert('请先登录后再点赞');
      return;
    }
    if (likedIds.includes(itemId)) return; // 已点过
    if (likeLoading[itemId]) return;

    setLikeLoading(prev => ({ ...prev, [itemId]: true }));
    const result = await storage.toggleMuseumLike(itemId);
    if (result.success) {
      setLikedIds(prev => [...prev, itemId]);
      // 更新本地的 likes 计数
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, likes: (item.likes || 0) + 1 } : item
      ));
    } else {
      alert(result.error || '点赞失败');
    }
    setLikeLoading(prev => ({ ...prev, [itemId]: false }));
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return d.toLocaleDateString('zh-CN');
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
            每个人匿名展出一个自己做过的决定<br />别人的故事，或许会给你的选择一些启发
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
              cursor: 'pointer',
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
              {user ? (
                <button
                  onClick={submitToMuseum}
                  disabled={!submitTitle.trim() || submitLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: submitTitle.trim() ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.05)',
                    color: submitTitle.trim() ? '#e8d48b' : 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(201,168,76,0.3)',
                    fontSize: '14px',
                    cursor: submitTitle.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {submitLoading ? '发布中...' : '匿名发布'}
                </button>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>请先登录以匿名发布</p>
              )}
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
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>
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
                  <span>{formatTime(item.created_at)}</span>
                  <button
                    onClick={() => handleLike(item.id)}
                    disabled={likedIds.includes(item.id) || likeLoading[item.id]}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      color: likedIds.includes(item.id) ? '#e8d48b' : '#c9a84c',
                      fontSize: '13px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: likedIds.includes(item.id) ? 'default' : 'pointer',
                      border: likedIds.includes(item.id) ? '1px solid rgba(232,212,139,0.3)' : 'none',
                      opacity: likedIds.includes(item.id) ? 0.7 : 1,
                    }}
                  >
                    {likedIds.includes(item.id) ? '❤️ 已赞赏' : `❤️ ${item.likes || 0}`}
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
