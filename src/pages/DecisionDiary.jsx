import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import storage from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { SUPABASE_ANON_KEY } from '../utils/supabase';

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
  const [expandedId, setExpandedId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'single', id } | { type: 'batch', ids }
  const [deleting, setDeleting] = useState(false);
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

  const confirmDelete = (entry) => {
    setConfirmAction({ type: 'single', id: entry.id });
  };

  const confirmBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({ type: 'batch', ids: [...selectedIds] });
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmAction || deleting) return;
    setDeleting(true);
    try {
      const ids = confirmAction.type === 'batch' ? confirmAction.ids : [confirmAction.id];
      const res = await storage.removeDiaryEntries(ids);
      if (!res.ok) {
        alert(`删除失败（云端拒绝了请求）：${res.error || '未知错误'}\n\n如果一直失败，可能是 Supabase 还没加 DELETE 策略，需要跑迁移 007_diary_delete_policy.sql`);
      }
      setDiary((prev) => prev.filter((d) => !ids.includes(d.id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setExpandedId((cur) => (ids.includes(cur) ? null : cur));
    } finally {
      setDeleting(false);
      setConfirmAction(null);
      if (selectMode && selectedIds.length === 0) setSelectMode(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === diary.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(diary.map((d) => d.id));
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
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
            {/* 批量操作栏 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              {selectMode ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedIds.length === diary.length && diary.length > 0}
                        onChange={toggleSelectAll} style={{ accentColor: '#c9a84c', width: '16px', height: '16px', cursor: 'pointer' }} />
                      全选
                    </label>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>已选 {selectedIds.length} / {diary.length}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setSelectMode(false); setSelectedIds([]); }}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', cursor: 'pointer' }}>
                      取消
                    </button>
                    <button onClick={confirmBatchDelete} disabled={selectedIds.length === 0}
                      style={{ padding: '8px 18px', borderRadius: '8px', background: selectedIds.length > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)', color: selectedIds.length > 0 ? '#f87171' : 'rgba(255,255,255,0.25)', border: selectedIds.length > 0 ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.08)', fontSize: '13px', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed' }}>
                      删除所选 ({selectedIds.length})
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <button onClick={() => setSelectMode(true)}
                    style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ☑ 批量删除
                  </button>
                </div>
              )}
            </div>
            {Object.entries(grouped).map(([month, entries]) => (
              <motion.div key={month} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '24px', height: '1px', background: '#c9a84c' }} />
                  <h3 style={{ fontSize: '16px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '3px' }}>{month}</h3>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.1)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {entries.map((entry) => {
                    const expanded = expandedId === entry.id;
                    const fullTime = entry.timestamp ? new Date(entry.timestamp) : null;
                    const isSelected = selectedIds.includes(entry.id);
                    return (
                      <motion.div key={entry.id} layout
                        onClick={() => {
                          if (selectMode) { toggleSelect(entry.id); return; }
                          setExpandedId(expanded ? null : entry.id);
                        }}
                        style={{
                          padding: '20px 24px', borderRadius: '12px',
                          position: 'relative',
                          background: expanded ? 'rgba(45,25,70,0.85)' : (isSelected ? 'rgba(248,113,113,0.12)' : 'rgba(35,20,56,0.6)'),
                          border: isSelected ? '1px solid rgba(248,113,113,0.5)' : (expanded ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(201,168,76,0.15)'),
                          borderLeft: isSelected ? '3px solid #f87171' : '3px solid #c9a84c', cursor: 'pointer',
                          transition: 'background 0.2s, border 0.2s',
                        }}>
                        {selectMode && (
                          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                            <input type="checkbox" checked={isSelected} readOnly
                              style={{ accentColor: '#f87171', width: '18px', height: '18px', cursor: 'pointer', pointerEvents: 'none' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', color: '#c9a84c', letterSpacing: '2px', marginBottom: '6px' }}>🎭 {entry.game}</div>
                            <p style={{ color: '#f5e6d3', fontSize: '15px', marginBottom: '8px', wordBreak: 'break-word' }}>
                              {entry.question || '记录了一次选择'}
                            </p>
                            {entry.result && !expanded && (
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {Array.isArray(entry.result) ? `底线：${entry.result.join('、')}` : entry.result}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                              {fullTime ? fullTime.toLocaleDateString('zh-CN') : ''}
                            </span>
                            <motion.span
                              animate={{ rotate: expanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}
                            >▶</motion.span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              style={{ overflow: 'hidden' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(201,168,76,0.2)' }}>
                                {entry.result && (
                                  <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', marginBottom: '6px' }}>结果</div>
                                    <div style={{ color: '#f5e6d3', fontSize: '14px', lineHeight: 1.7, wordBreak: 'break-word' }}>
                                      {Array.isArray(entry.result) ? (
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                          {entry.result.map((r, i) => <li key={i} style={{ marginBottom: '4px' }}>{r}</li>)}
                                        </ul>
                                      ) : entry.result}
                                    </div>
                                  </div>
                                )}

                                {/* 按 type 渲染专属详情 */}
                                {entry.type === 'reverse-fear' && Array.isArray(entry.result) && entry.result.length > 0 && (
                                  <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', marginBottom: '6px' }}>删去的恐惧</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.7 }}>
                                      你从所有恐惧中删掉了 {entry.result.length} 项，最终只留下了这条底线。
                                    </div>
                                  </div>
                                )}

                                {entry.type === 'personality-test' && entry.scores && (
                                  <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', marginBottom: '8px' }}>大五人格分数</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                                      {Object.entries(entry.scores).map(([k, v]) => {
                                        const labels = { openness: '🎨 开放性', conscientiousness: '📋 尽责性', extraversion: '🎤 外向性', agreeableness: '🤝 宜人性', neuroticism: '🧘 情绪稳定性' };
                                        return (
                                          <div key={k} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.15)' }}>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{labels[k] || k}</div>
                                            <div style={{ fontSize: '16px', color: '#e8d48b', fontWeight: 'bold' }}>{v}<span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>/10</span></div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {entry.type === 'parallel-letters' && entry.chosen && (
                                  <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.25)' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', marginBottom: '6px' }}>选项</div>
                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                                      A · <span style={{ color: entry.chosen === entry.optionA ? '#e8d48b' : 'rgba(255,255,255,0.4)' }}>{entry.optionA}</span><br />
                                      B · <span style={{ color: entry.chosen === entry.optionB ? '#e8d48b' : 'rgba(255,255,255,0.4)' }}>{entry.optionB}</span>
                                    </div>
                                  </div>
                                )}

                                {entry.type === 'parallel-letters' && Array.isArray(entry.letters) && entry.letters.length > 0 && (
                                  <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', marginBottom: '8px' }}>三封信</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {entry.letters.map((l, i) => (
                                        <div key={i} style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.15)' }}>
                                          <div style={{ fontSize: '13px', color: '#c9a84c', marginBottom: '6px', letterSpacing: '1px' }}>{l.title || `第 ${i + 1} 封`}</div>
                                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{l.content || ''}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {entry.type === 'friend-room' && Array.isArray(entry.questions) && entry.questions.length > 0 && (
                                  <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', marginBottom: '8px' }}>
                                      {entry.originalQuestion ? `我回答的 10 道题（朋友的拷问：「${entry.originalQuestion.slice(0, 30)}...」）` : '10 道灵魂拷问'}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {entry.questions.map((q, qi) => {
                                        const chosenLabel = entry.answers?.[q.id ?? qi];
                                        const chosenText = (q.options || []).find((o) => o.label === chosenLabel)?.text || chosenLabel;
                                        return (
                                          <div key={q.id ?? qi} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.12)' }}>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '6px' }}>
                                              <span style={{ color: '#c9a84c' }}>{qi + 1}.</span> {q.q}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                                              {chosenLabel ? (
                                                <>我选了：<span style={{ color: '#e8d48b' }}>{chosenLabel}. {chosenText}</span></>
                                              ) : (
                                                <span style={{ color: 'rgba(255,255,255,0.35)' }}>未作答</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {entry.tarotCard && (
                                      <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '2px' }}>抽到的塔罗牌  </span>
                                        <span style={{ fontSize: '14px', color: '#a855f7' }}>{entry.tarotCard.emoji} {entry.tarotCard.name}</span>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>{entry.tarotCard.meaning}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                    🕐 {fullTime ? fullTime.toLocaleString('zh-CN', { hour12: false }) : ''}
                                  </span>
                                  <button onClick={(e) => { e.stopPropagation(); confirmDelete(entry); }}
                                    style={{
                                      padding: '6px 14px', borderRadius: '6px',
                                      background: 'rgba(248,113,113,0.12)', color: '#f87171',
                                      border: '1px solid rgba(248,113,113,0.3)',
                                      fontSize: '12px', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '4px',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                                  >🗑 删除</button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </>
        )}

        {/* 自定义删除确认弹窗 */}
        <AnimatePresence>
          {confirmAction && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!deleting) setConfirmAction(null); }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
              }}>
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'linear-gradient(160deg, #2d1946 0%, #1a0a2e 100%)',
                  borderRadius: '16px', padding: '32px 28px', maxWidth: '420px', width: '100%',
                  border: '1px solid rgba(248,113,113,0.3)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '44px', marginBottom: '12px' }}>🗑</div>
                  <h3 style={{ fontSize: '18px', color: '#f87171', letterSpacing: '2px', marginBottom: '8px' }}>
                    确认删除
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.7 }}>
                    {confirmAction.type === 'batch'
                      ? <>将永久删除你选择的 <strong style={{ color: '#f87171' }}>{confirmAction.ids.length}</strong> 条记录，云端和本地都会清掉。</>
                      : <>将永久删除这条「<strong style={{ color: '#f87171' }}>{diary.find((d) => d.id === confirmAction.id)?.game || '记录'}</strong>」记录，云端和本地都会清掉。</>}
                    <br />此操作不可撤销。
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setConfirmAction(null)} disabled={deleting}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: '10px', fontSize: '14px',
                      background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.15)', cursor: deleting ? 'not-allowed' : 'pointer',
                    }}>
                    取消
                  </button>
                  <button onClick={handleDeleteConfirmed} disabled={deleting}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold',
                      background: deleting ? 'rgba(248,113,113,0.3)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#fff', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer',
                    }}>
                    {deleting ? '删除中...' : '确认删除'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
