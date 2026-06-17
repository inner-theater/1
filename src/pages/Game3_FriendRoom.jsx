import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import storage from '../utils/storage';
import InsightPanel from '../components/InsightPanel';

const QUESTIONS = [
  '如果你最好的朋友在下一个岔路口等你，你觉得他/她会穿着什么颜色的衣服？',
  '用三个词来形容你现在最真实的心情：',
  '如果这次选择是一道菜，你觉得它是什么味道？',
  '闭上眼睛，你脑海中第一个出现的画面是什么？',
  '你觉得十年后的自己会对现在的你说什么？',
  '如果你只能带一件东西去荒岛，这件东西和你的选择有什么关系？',
  '用一个动物来形容你面对这个选择时的状态：',
  '假设你已经做出决定了，现在的心跳是快还是慢？',
  '你最近一次笑到停不下来是因为什么？',
  '如果这个选择是一部电影的名字，会叫什么？',
];

const TAROT_CARDS = [
  { name: 'The Star', emoji: '⭐', meaning: '希望与灵感在指引你' },
  { name: 'The Sun', emoji: '☀️', meaning: '光明和快乐即将到来' },
  { name: 'The Moon', emoji: '🌙', meaning: '相信直觉，答案就在迷雾中' },
  { name: 'The Chariot', emoji: '🏇', meaning: '你是自己命运的驾驶者' },
  { name: 'The Hermit', emoji: '🏮', meaning: '独处时的思考最接近真相' },
  { name: 'The Lovers', emoji: '💕', meaning: '这个选择关乎你真正在乎的' },
  { name: 'The Tower', emoji: '⚡', meaning: '打破旧的才有新的可能' },
  { name: 'The Fool', emoji: '🃏', meaning: '带着好奇去冒险吧' },
  { name: 'Death', emoji: '🦋', meaning: '结束意味着新的开始' },
  { name: 'Strength', emoji: '🦁', meaning: '你比自己想象中更强大' },
  { name: 'The World', emoji: '🌍', meaning: '这是你完整自我的重要一环' },
  { name: 'Wheel of Fortune', emoji: '🎡', meaning: '命运之轮已经转动' },
];

const FRIEND_QUESTIONS = [
  '你觉得 TA 在害怕什么？',
  'TA 做什么事的时候最开心？',
  '用三个词形容你眼中的 TA：',
  '你觉得 TA 最需要的是什么？',
  '如果让你替 TA 做一个决定，你会选什么？为什么？',
  'TA 的哪个选择让你最惊讶？',
];

export default function Game3_FriendRoom() {
  const [step, setStep] = useState('input');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showCard, setShowCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [shareCode, setShareCode] = useState(null);
  const [friendView, setFriendView] = useState(false);
  const [friendAnswers, setFriendAnswers] = useState({});
  const [currentFriendQ, setCurrentFriendQ] = useState(0);
  const [friendQInput, setFriendQInput] = useState('');
  const [showFriendResult, setShowFriendResult] = useState(false);

  const startGame = () => {
    if (!question.trim()) return;
    setAnswers([]);
    setCurrentAnswer('');
    setStep('self');
  };

  const addAnswer = () => {
    if (currentAnswer.trim()) {
      setAnswers([...answers, currentAnswer.trim()]);
      setCurrentAnswer('');
    }
  };

  const revealTarot = () => {
    const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
    setSelectedCard(card);
    setShowCard(true);
    storage.addDiaryEntry({
      game: '朋友灵魂拷问室',
      question,
      answers,
      tarot: card.name,
      type: 'friend-room',
    });
  };

  const createShareLink = () => {
    const code = storage.createShareLink('friend-room', {
      question,
      answers,
      tarot: selectedCard,
    });
    setShareCode(code);
  };

  const enterFriendView = () => {
    setFriendView(true);
    setShowCard(false);
    setSelectedCard(null);
  };

  const handleShareCodeSubmit = () => {
    // Enter friend view using share code
    if (shareCode) {
      enterFriendView();
    }
  };

  const nextFriendQuestion = () => {
    if (friendQInput.trim()) {
      setFriendAnswers({ ...friendAnswers, [currentFriendQ]: friendQInput.trim() });
      setFriendQInput('');
      if (currentFriendQ < FRIEND_QUESTIONS.length - 1) {
        setCurrentFriendQ(currentFriendQ + 1);
      } else {
        setShowFriendResult(true);
      }
    }
  };

  const resetGame = () => {
    setStep('input');
    setAnswers([]);
    setShowCard(false);
    setSelectedCard(null);
    setShareCode(null);
    setFriendView(false);
    setFriendAnswers({});
    setCurrentFriendQ(0);
    setShowFriendResult(false);
    setQuestion('');
  };

  // Friend view
  if (friendView) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '56px', display: 'block' }}>🔮</span>
            <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '3px' }}>
              朋友灵魂拷问室
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              你的朋友正在面临一个选择，请认真回答以下问题
            </p>
          </div>

          {!showFriendResult ? (
            <div style={{
              background: 'rgba(35,20,56,0.8)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(201,168,76,0.2)',
            }}>
              <div style={{
                background: 'rgba(201,168,76,0.1)',
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '24px',
                color: '#e8d48b',
                fontSize: '14px',
              }}>
                TA 正在纠结："{question}"
              </div>

              <div style={{ color: '#c9a84c', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>
                问题 {currentFriendQ + 1}/{FRIEND_QUESTIONS.length}
              </div>
              <p style={{ color: '#f5e6d3', fontSize: '16px', marginBottom: '16px' }}>
                {FRIEND_QUESTIONS[currentFriendQ]}
              </p>

              <textarea
                value={friendQInput}
                onChange={(e) => setFriendQInput(e.target.value)}
                rows={4}
                placeholder="写下你的真实想法..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(201,168,76,0.3)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '16px',
                }}
              />

              <button
                onClick={nextFriendQuestion}
                disabled={!friendQInput.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: friendQInput.trim()
                    ? 'linear-gradient(135deg, #c9a84c, #e8d48b)'
                    : 'rgba(255,255,255,0.1)',
                  color: friendQInput.trim() ? '#1a0a2e' : 'rgba(255,255,255,0.3)',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  cursor: friendQInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {currentFriendQ < FRIEND_QUESTIONS.length - 1 ? '下一题' : '提交回答'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1 }}
                style={{ fontSize: '64px', marginBottom: '16px' }}
              >
                💝
              </motion.div>
              <h3 style={{ color: '#e8d48b', fontSize: '20px', marginBottom: '8px' }}>
                你的回答已送出！
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                这些回答将帮助你的朋友看清内心的方向
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>🔮</span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            朋友灵魂拷问室
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            让朋友问出的古怪问题，帮你找到藏在心底的答案
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ background: 'rgba(35,20,56,0.8)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(201,168,76,0.2)' }}>
              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '8px', display: 'block' }}>
                你在纠结什么？
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder="告诉你的朋友你在纠结什么..."
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', outline: 'none', resize: 'vertical', marginBottom: '24px' }}
              />
              <button onClick={startGame} disabled={!question.trim()}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: question.trim() ? 'linear-gradient(135deg, #c9a84c, #e8d48b)' : 'rgba(255,255,255,0.1)', color: question.trim() ? '#1a0a2e' : 'rgba(255,255,255,0.3)', fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', cursor: question.trim() ? 'pointer' : 'not-allowed' }}>
                开始灵魂拷问
              </button>
            </motion.div>
          )}

          {step === 'self' && (
            <motion.div key="self" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ background: 'rgba(35,20,56,0.8)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(201,168,76,0.2)' }}>
                <p style={{ color: '#e8d48b', textAlign: 'center', letterSpacing: '2px', marginBottom: '24px' }}>
                  想象你的朋友在问你这些问题 —— 尽可能诚实地回答
                </p>

                {/* Random question */}
                <div style={{
                  background: 'rgba(201,168,76,0.08)',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  borderLeft: '3px solid #c9a84c',
                }}>
                  <p style={{ color: '#e8d48b', fontSize: '14px', marginBottom: '4px' }}>
                    朋友问你：
                  </p>
                  <p style={{ color: '#f5e6d3', fontSize: '16px' }}>
                    {QUESTIONS[answers.length % QUESTIONS.length]}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAnswer()}
                    placeholder="你的回答..."
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                  <button onClick={addAnswer}
                    style={{ padding: '12px 20px', borderRadius: '8px', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)' }}>
                    回答
                  </button>
                </div>

                {answers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {answers.map((a, i) => (
                      <div key={i} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#f5e6d3', fontSize: '13px' }}>
                        {a}
                      </div>
                    ))}
                  </div>
                )}

                {answers.length >= 3 && !showCard && (
                  <button onClick={revealTarot}
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #6b21a8, #9333ea)', color: '#fff', fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px' }}>
                    揭晓塔罗启示 🔮
                  </button>
                )}
              </div>

              {/* Tarot Reveal */}
              <AnimatePresence>
                {showCard && selectedCard && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
                    style={{ textAlign: 'center', padding: '40px', background: 'rgba(35,20,56,0.9)', borderRadius: '16px', border: '2px solid #c9a84c', marginTop: '24px' }}
                  >
                    <div style={{ fontSize: '80px', marginBottom: '12px' }}>{selectedCard.emoji}</div>
                    <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', color: '#e8d48b', marginBottom: '8px', letterSpacing: '3px' }}>
                      {selectedCard.name}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginBottom: '24px' }}>
                      {selectedCard.meaning}
                    </p>

                    {/* Share section */}
                    {shareCode ? (
                      <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                      }}>
                        <p style={{ color: '#c9a84c', fontSize: '12px', marginBottom: '6px' }}>
                          分享码（发送给朋友，让他们为你回答）：
                        </p>
                        <p style={{ color: '#fff', fontSize: '20px', fontFamily: 'monospace', letterSpacing: '3px' }}>
                          {shareCode}
                        </p>
                      </div>
                    ) : (
                      <button onClick={createShareLink}
                        style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)', fontSize: '14px', marginBottom: '16px' }}>
                        生成分享码
                      </button>
                    )}

                    <div>
                      <button onClick={resetGame}
                        style={{ padding: '10px 24px', borderRadius: '8px', background: 'transparent', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)', fontSize: '13px' }}>
                        重新开始
                      </button>

                      <InsightPanel
                        gameType="friend-room"
                        visible={true}
                        context={{
                          question,
                          options: answers?.length ? answers.join('、') : '',
                        }}
                      />
                    </div>
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
