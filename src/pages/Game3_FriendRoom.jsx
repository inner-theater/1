import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import storage from '../utils/storage';
import InsightPanel from '../components/InsightPanel';
import { generateQuestions } from '../utils/ai-insight';
import { supabase } from '../utils/supabase';

export default function Game3_FriendRoom() {
  const [step, setStep] = useState('input');
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultCard, setResultCard] = useState(null);
  const [posterImage, setPosterImage] = useState(null);
  const posterRef = useRef(null);

  const generateAIQuestions = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const qs = await generateQuestions(question);
      if (qs && qs.length >= 5) {
        setQuestions(qs.slice(0, 10).map((q, i) => ({
          ...q,
          id: i,
          options: Array.isArray(q.options) ? q.options.map((o, j) => ({
            label: String.fromCharCode(65 + j), text: o.replace(/^[A-D][.、]\s*/, ''),
          })) : [],
        })));
        setStep('sharing');
        generateQR();
      } else {
        // fallback: use built-in questions
        setQuestions(getDefaultQuestions(question));
        setStep('sharing');
        generateQR();
      }
    } catch {
      setQuestions(getDefaultQuestions(question));
      setStep('sharing');
      generateQR();
    }
    setLoading(false);
  };

  const generateQR = () => {
    const code = storage.createShareLink('friend-room', { question, questions });
    const url = `https://inner-theater.github.io/1/#/answer/${code}`;
    setShareUrl(url);
    QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#1a0a2e', light: '#ffffff' } })
      .then(setQrDataUrl);
  };

  const handleAnswer = (qId, option) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const submitAnswers = () => {
    const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    setResultCard(card);
    setShowResult(true);
    storage.addDiaryEntry({
      game: '朋友灵魂拷问室',
      question: question,
      result: `得到塔罗牌「${card.name} ${card.emoji}」——${card.meaning}`,
      type: 'friend-room',
    });
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const cardEmojis = ['🃏', '🔮', '✨', '🌟', '💫'];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>🔮</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            朋友灵魂拷问室
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            让朋友的视角，照见你没发现的自己
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ background: 'rgba(35,20,56,0.8)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(201,168,76,0.2)' }}>
              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '12px', display: 'block' }}>
                告诉我你的烦恼，AI 帮你设计拷问题目
              </label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="比如：我该不该接受这份外地的工作offer？" rows={4}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', outline: 'none', resize: 'vertical', marginBottom: '20px' }} />
              <button onClick={generateAIQuestions} disabled={!question.trim() || loading}
                style={{ width: '100%', padding: '16px', borderRadius: '12px',
                  background: question.trim() ? 'linear-gradient(135deg, #c9a84c, #e8d48b)' : 'rgba(255,255,255,0.1)',
                  color: question.trim() ? '#1a0a2e' : 'rgba(255,255,255,0.3)',
                  fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', border: 'none',
                  cursor: question.trim() ? 'pointer' : 'not-allowed' }}>
                {loading ? 'AI 正在生成个性化题目...' : '生成灵魂拷问题目'}
              </button>
            </motion.div>
          )}

          {step === 'sharing' && (
            <motion.div key="sharing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Share poster */}
              <div ref={posterRef} style={{
                background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)',
                borderRadius: '20px', padding: '32px', border: '2px solid rgba(201,168,76,0.3)',
                textAlign: 'center', position: 'relative',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔮</div>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '3px', marginBottom: '12px' }}>
                  朋友灵魂拷问室
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                  我正纠结：「{question}」<br />帮我回答{questions.length}道拷问，让我从你的视角看见自己
                </p>
                {qrDataUrl && (
                  <div style={{
                    display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '12px',
                  }}>
                    <img src={qrDataUrl} alt="QR" style={{ width: '160px', height: '160px', display: 'block' }} />
                    <p style={{ color: '#333', fontSize: '11px', marginTop: '6px' }}>扫码帮我回答</p>
                  </div>
                )}
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '16px', wordBreak: 'break-all' }}>
                  或复制链接：{shareUrl}
                </p>
              </div>

              <div style={{ marginTop: '32px' }}>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>
                  你也可以自己先回答试试 ↓
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {questions.map((q, qi) => (
                    <div key={q.id} style={{
                      padding: '20px', borderRadius: '12px',
                      background: 'rgba(35,20,56,0.8)', border: '1px solid rgba(201,168,76,0.2)',
                    }}>
                      <p style={{ color: '#f5e6d3', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                        {qi + 1}. {q.q}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {(q.options || []).map((opt) => (
                          <button key={opt.label} onClick={() => handleAnswer(q.id, opt.label)}
                            style={{
                              padding: '10px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'left',
                              background: answers[q.id] === opt.label ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                              border: answers[q.id] === opt.label ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)',
                              color: answers[q.id] === opt.label ? '#e8d48b' : 'rgba(255,255,255,0.6)',
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
                    已回答 {answeredCount}/{questions.length}
                  </p>
                  <button onClick={submitAnswers} disabled={!allAnswered}
                    style={{ padding: '14px 40px', borderRadius: '12px',
                      background: allAnswered ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.08)',
                      color: allAnswered ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px',
                      border: 'none', cursor: allAnswered ? 'pointer' : 'not-allowed' }}>
                    抽取你的塔罗牌
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'sharing' && showResult && resultCard && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{ textAlign: 'center', padding: '40px', background: 'rgba(35,20,56,0.9)', borderRadius: '16px', border: '2px solid #a855f7', marginTop: '24px' }}>
              <motion.div animate={{ rotateY: [90, 0] }} transition={{ duration: 0.8 }}
                style={{ fontSize: '80px', marginBottom: '16px' }}>
                {resultCard.emoji}
              </motion.div>
              <h3 style={{ fontSize: '24px', color: '#a855f7', letterSpacing: '3px', marginBottom: '8px' }}>
                {resultCard.name}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', fontStyle: 'italic', marginBottom: '8px' }}>
                {resultCard.meaning}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                这不是预言——是你借朋友的视角看见的自己
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <button onClick={() => { setAnswers({}); setShowResult(false); }}
                  style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', fontSize: '14px', cursor: 'pointer' }}>
                  重新回答
                </button>
                <button onClick={() => { setStep('input'); setQuestions([]); setAnswers({}); setShowResult(false); }}
                  style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px', cursor: 'pointer' }}>
                  换个问题
                </button>
              </div>

              <InsightPanel
                gameType="friend-room"
                visible={true}
                context={{
                  question,
                  feedback: questions.slice(0, 5).map((q, i) => `Q${i + 1}: ${answers[q.id] ? `选了${answers[q.id]}` : ''}`).join('; '),
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const TAROT_CARDS = [
  { name: 'The Star', emoji: '⭐', meaning: '希望与灵感在指引你' },
  { name: 'The Sun', emoji: '☀️', meaning: '光明和快乐即将到来' },
  { name: 'The Moon', emoji: '🌙', meaning: '直觉比理性更清楚方向' },
  { name: 'The Lovers', emoji: '💞', meaning: '忠于内心的选择就是最好的选择' },
  { name: 'Strength', emoji: '🦁', meaning: '你有超出自己想象的力量' },
  { name: 'The Chariot', emoji: '🐎', meaning: '果断前进，犹豫才是一切阻碍' },
  { name: 'The Hermit', emoji: '🏔️', meaning: '独处中能找到最真实的答案' },
  { name: 'Wheel of Fortune', emoji: '🎡', meaning: '好运正在向你转来' },
  { name: 'Justice', emoji: '⚖️', meaning: '公平的判断力在保护你' },
  { name: 'Temperance', emoji: '🌊', meaning: '平衡和耐心会带来回报' },
];

function getDefaultQuestions(dilemma) {
  return [
    { id: 0, q: '如果你最好的朋友和你面临一模一样的处境，你会给他什么建议？', options: [
      { label: 'A', text: '果断选一条路，别纠结' }, { label: 'B', text: '再等等，看情况' }, { label: 'C', text: '让直觉做决定' }, { label: 'D', text: '列个清单比一比' },
    ]},
    { id: 1, q: `面对「${dilemma.slice(0, 10)}...」这个选择，你最怕的是什么？`, options: [
      { label: 'A', text: '选了之后后悔' }, { label: 'B', text: '错过另一个机会' }, { label: 'C', text: '让在乎的人失望' }, { label: 'D', text: '发现自己其实根本不清楚想要什么' },
    ]},
    { id: 2, q: '如果你现在已经有答案了，你的身体有什么感觉？', options: [
      { label: 'A', text: '心跳加速，很兴奋' }, { label: 'B', text: '胃有点紧，很紧张' }, { label: 'C', text: '没什么特别的感觉' }, { label: 'D', text: '松了口气' },
    ]},
    { id: 3, q: '你觉得五年后的自己回头看这个决定，会说什么？', options: [
      { label: 'A', text: '干得好，当时就该这么选' }, { label: 'B', text: '没事的，选什么都会成长' }, { label: 'C', text: '那件事其实没那么重要' }, { label: 'D', text: '谢谢你当时认真想了' },
    ]},
    { id: 4, q: '在你纠结的这段时间，有没有一个人让你特别想听听他/她的意见？', options: [
      { label: 'A', text: '有，而且我知道他/她会说什么' }, { label: 'B', text: '有，但不敢问' }, { label: 'C', text: '没有特别想找的人' }, { label: 'D', text: '我只想听自己的' },
    ]},
    { id: 5, q: '如果这个选择是一道菜，你觉得它是什么味道？', options: [
      { label: 'A', text: '酸甜的，有期待也有不安' }, { label: 'B', text: '辣的，很有挑战性' }, { label: 'C', text: '淡淡的，顺其自然' }, { label: 'D', text: '苦的，但知道有回甘' },
    ]},
    { id: 6, q: '用一句话说服现在的你——你会说什么？', options: [
      { label: 'A', text: '不做会后悔' }, { label: 'B', text: '你已经准备好了' }, { label: 'C', text: '不管选什么，你都能应对' }, { label: 'D', text: '别想太多，去就对了' },
    ]},
    { id: 7, q: '你最后一次因为什么事情笑到停不下来？', options: [
      { label: 'A', text: '朋友说了个笑话' }, { label: 'B', text: '看了一部好电影' }, { label: 'C', text: '自己干了件傻事' }, { label: 'D', text: '记不清了' },
    ]},
    { id: 8, q: '如果做完选择后可以吃一顿庆祝饭，你想吃什么？', options: [
      { label: 'A', text: '火锅，热热闹闹的' }, { label: 'B', text: '日料，精致安静的' }, { label: 'C', text: '自己做的，踏实的' }, { label: 'D', text: '无所谓，吃什么都行' },
    ]},
    { id: 9, q: '闭上眼睛三秒，你第一个看到的画面是什么？', options: [
      { label: 'A', text: '一片开阔的风景' }, { label: 'B', text: '熟悉的家或街道' }, { label: 'C', text: '一个模糊的背影' }, { label: 'D', text: '一片空白' },
    ]},
  ];
}
