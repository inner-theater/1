import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

const SUPABASE_FUNCTION_URL = 'https://uemvpdbuhzfomfstqias.supabase.co/functions/v1/generate-insight';
const DAILY_LIMIT = 3;

const MODELS = [
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', desc: '顶级推理' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', desc: '快速推理' },
  { id: 'kimi-k2.5', label: 'Kimi K2.5', desc: '长文本优先' },
  { id: 'kimi-k2.6', label: 'Kimi K2.6', desc: '最新版本' },
  { id: 'MiniMax-M2.1', label: 'MiniMax M2.1', desc: '深度分析' },
  { id: 'qwen-turbo', label: '通义千问 Turbo', desc: '快速·免费' },
  { id: 'qwen-plus', label: '通义千问 Plus', desc: '深度·推荐' },
];

export default function DecisionDiary() {
  const [diary, setDiary] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(0);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const d = await storage.getDiary();
    setDiary(Array.isArray(d) ? d : []);
    if (user) {
      const u = await storage.getDailyUsage();
      setUsage(typeof u === 'number' ? u : 0);
    }
  };

  const runAnalysis = async () => {
    if (diary.length === 0) return;
    if (user && usage >= DAILY_LIMIT) return;
    setLoading(true);
    try {
      const diarySummary = diary.slice(0, 50).map((d, i) =>
        `[${i + 1}] ${d.game}: ${d.question || ''} → ${d.result || ''}`
      ).join('\n');

      const prompt = `你是一位资深的心理分析师。请根据以下用户的决策日记历史，生成一份温暖而有洞察力的人物画像分析。

用户的决策记录（共${diary.length}条，显示最近${Math.min(50, diary.length)}条）：
${diarySummary}

请分析：
1. 从这些决策中，可以看到他是一个什么样的人？有什么性格特点？
2. 他在决策中最看重什么？是否有反复出现的模式？
3. 给他一些温暖的鼓励和切实可行的建议，帮助他在未来的选择中更从容。

语言风格：温柔、真诚、不鸡汤。`;

      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType: 'diary-analysis',
          context: {
            messages: [{ role: 'user', content: prompt }],
            maxTokens: 800,
            model: selectedModel,
          },
        }),
      });
      const data = await res.json();
      if (data.content) {
        setAnalysis(data.content);
        if (user) {
          await storage.incrementDailyUsage();
          const u = await storage.getDailyUsage();
          setUsage(u);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

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

  const grouped = groupByMonth(diary);
  const canAnalyze = diary.length > 0 && (!user || usage < DAILY_LIMIT);

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

        {/* AI Analysis Section */}
        {diary.length >= 2 && (
          <div style={{
            background: 'rgba(26,10,46,0.7)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(96,165,250,0.2)',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🧠</span>
                <span style={{ color: '#60a5fa', fontSize: '14px', letterSpacing: '2px', fontFamily: 'var(--font-display)' }}>
                  AI 人物画像分析
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
                    background: 'rgba(0,0,0,0.3)', color: '#fff',
                    border: '1px solid rgba(201,168,76,0.3)', outline: 'none',
                  }}>
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>

                <button onClick={runAnalysis} disabled={!canAnalyze || loading}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', fontSize: '13px', letterSpacing: '1px',
                    background: canAnalyze ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' : 'rgba(255,255,255,0.1)',
                    color: canAnalyze ? '#fff' : 'rgba(255,255,255,0.3)',
                    border: 'none', cursor: canAnalyze ? 'pointer' : 'not-allowed',
                  }}>
                  {loading ? '分析中...' : '开始分析'}
                </button>
              </div>
            </div>

            {user ? (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '8px' }}>
                今日剩余 {DAILY_LIMIT - usage} / {DAILY_LIMIT} 次
              </p>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '8px' }}>
                登录后解锁每日 {DAILY_LIMIT} 次 AI 分析
              </p>
            )}

            <AnimatePresence>
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(96,165,250,0.15)', overflow: 'hidden' }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                    {analysis}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {diary.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', background: 'rgba(35,20,56,0.5)',
            borderRadius: '16px', border: '1px dashed rgba(201,168,76,0.2)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
              还没有记录任何决策<br />去剧场大厅玩一个游戏吧
            </p>
            <button onClick={() => navigate('/')}
              style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)', fontSize: '14px', cursor: 'pointer' }}>
              去剧场大厅 →
            </button>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([month, entries]) => (
              <motion.div key={month} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '24px', height: '1px', background: '#c9a84c' }} />
                  <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '3px' }}>{month}</h3>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.1)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {entries.map((entry) => (
                    <motion.div key={entry.id} whileHover={{ x: 4 }}
                      style={{ padding: '20px 24px', borderRadius: '12px', background: 'rgba(35,20,56,0.6)', border: '1px solid rgba(201,168,76,0.15)', borderLeft: '3px solid #c9a84c' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#c9a84c', letterSpacing: '2px', marginBottom: '6px' }}>🎭 {entry.game}</div>
                          <p style={{ color: '#f5e6d3', fontSize: '15px', marginBottom: '8px' }}>{entry.question || '记录了一次选择'}</p>
                          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                            {entry.result ? (Array.isArray(entry.result) ? `底线：${entry.result.join('、')}` : entry.result) : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                          {new Date(entry.timestamp).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </>
        )}
      </motion.div>
    </div>
  );
}
