import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

export default function AnswerPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [friendName, setFriendName] = useState('');

  useEffect(() => {
    const d = storage.getShareData(code);
    if (!d) { navigate('/'); return; }
    setData(d);
    if (user) setFriendName(user.email?.split('@')[0] || '');
  }, [code]);

  const handleAnswer = (qId, option) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const submitAnswers = () => {
    if (!data) return;
    storage.addDiaryEntry({
      game: '朋友灵魂拷问室',
      question: data.data.question,
      result: `朋友「${friendName || '匿名'}」的回答：${data.data.questions.length}道题已完成`,
      type: 'friend-room',
      friend: friendName || '匿名朋友',
    });
    setSubmitted(true);
  };

  const qs = data?.data?.questions || [];
  const answered = Object.keys(answers).length;
  const allDone = qs.length > 0 && answered === qs.length;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔮</span>
          <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '3px' }}>
            朋友灵魂拷问室
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px', fontSize: '14px', lineHeight: 1.6 }}>
            你的朋友正在纠结：<br /><strong style={{ color: '#f5e6d3' }}>「{data?.data?.question || ''}」</strong>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>
            帮他回答 {qs.length} 道灵魂拷问，让他从你的视角看见自己
          </p>
        </div>

        {!submitted ? (
          <>
            {!user ? (
              <div style={{
                textAlign: 'center', padding: '24px', borderRadius: '12px',
                background: 'rgba(35,20,56,0.6)', border: '1px dashed rgba(201,168,76,0.2)', marginBottom: '20px',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>
                  你的名字（可选，留空为匿名）
                </p>
                <input value={friendName} onChange={(e) => setFriendName(e.target.value)}
                  placeholder="输入你的名字"
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', outline: 'none', textAlign: 'center' }} />
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '16px' }}>
                回答将以「{friendName}」的名义记录
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {qs.map((q, qi) => (
                <div key={q.id || qi} style={{
                  padding: '20px', borderRadius: '12px', background: 'rgba(35,20,56,0.8)', border: '1px solid rgba(201,168,76,0.2)',
                }}>
                  <p style={{ color: '#f5e6d3', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    {qi + 1}. {q.q}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(q.options || []).map((opt) => (
                      <button key={opt.label} onClick={() => handleAnswer(q.id || qi, opt.label)}
                        style={{
                          padding: '10px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'left',
                          background: answers[q.id || qi] === opt.label ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                          border: answers[q.id || qi] === opt.label ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)',
                          color: answers[q.id || qi] === opt.label ? '#e8d48b' : 'rgba(255,255,255,0.6)',
                          cursor: 'pointer',
                        }}>
                        {opt.label}. {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '12px' }}>
                已回答 {answered}/{qs.length}
              </p>
              <button onClick={submitAnswers} disabled={!allDone}
                style={{ padding: '14px 40px', borderRadius: '12px',
                  background: allDone ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.08)',
                  color: allDone ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px',
                  border: 'none', cursor: allDone ? 'pointer' : 'not-allowed' }}>
                提交回答 ✨
              </button>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '40px', background: 'rgba(35,20,56,0.9)', borderRadius: '16px', border: '2px solid #a855f7' }}>
            <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }}>💌</span>
            <h3 style={{ fontSize: '20px', color: '#a855f7', letterSpacing: '2px', marginBottom: '8px' }}>
              你的回答已经发送
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6 }}>
              你的朋友会收到你的视角。<br />有时候，答案不在自己心里，在别人眼里。
            </p>
            <button onClick={() => navigate('/')}
              style={{ marginTop: '20px', padding: '12px 28px', borderRadius: '10px', background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', fontSize: '14px', cursor: 'pointer' }}>
              回到剧场大厅
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
