import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import storage from '../utils/storage';
import InsightPanel from '../components/InsightPanel';

const GAME_TIME = 5; // 5-second countdown
const MAX_RETRIES = 1; // After first catch, only 1 retry (forced blind mode)
const BLIND_UNLOCK_KEY = 'instinct_hand_completed';

const ORB_COLORS = [
  { bg: '#c9a84c', glow: 'rgba(201,168,76,0.7)', tag: '金' },
  { bg: '#a855f7', glow: 'rgba(168,85,247,0.7)', tag: '紫' },
  { bg: '#60a5fa', glow: 'rgba(96,165,250,0.7)', tag: '蓝' },
  { bg: '#f87171', glow: 'rgba(248,113,113,0.7)', tag: '红' },
  { bg: '#34d399', glow: 'rgba(52,211,153,0.7)', tag: '绿' },
  { bg: '#fb923c', glow: 'rgba(251,146,60,0.7)', tag: '橙' },
];

const INTERFERENCE = [
  '你确定？', '另一个钱多！', '妈说稳定好', '再想想？',
  '风险大吧？', '万一后悔呢', '你上次就选错了',
  '大家都选那个', '这个更轻松', '别冲动！',
];

// Random floating path waypoints — 4 points, each in [-1, 1] range
function randomPath() {
  return Array.from({ length: 4 }, () => Math.random() * 2 - 1);
}

// ========== OrbBalls ==========
function OrbBalls({ balls, onCatch, disabled, blindMode, showInterference }) {
  const [interferenceMsgs, setInterferenceMsgs] = useState([]);
  const [collisionEvents, setCollisionEvents] = useState([]);

  // Interference floating text
  useEffect(() => {
    if (!showInterference || disabled) { setInterferenceMsgs([]); return; }
    const spawn = () => {
      setInterferenceMsgs((prev) => [
        ...prev.slice(-4),
        {
          id: Date.now(),
          text: INTERFERENCE[Math.floor(Math.random() * INTERFERENCE.length)],
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 80,
          dx: (Math.random() - 0.5) * 40,
          dy: (Math.random() - 0.5) * 30,
        },
      ]);
    };
    spawn();
    const timer = setInterval(spawn, 600);
    return () => clearInterval(timer);
  }, [showInterference, disabled]);

  // Collision & swap
  useEffect(() => {
    if (disabled || balls.length < 2) return;
    const check = () => {
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          if (Math.random() < 0.025) {
            const ts = Date.now();
            setCollisionEvents((prev) => [...prev.slice(-3), { ts, a: i, b: j }]);
            setTimeout(() => setCollisionEvents((prev) => prev.filter((e) => e.ts !== ts)), 800);
          }
        }
      }
    };
    const timer = setInterval(check, 600);
    return () => clearInterval(timer);
  }, [disabled, balls.length]);

  const getSwap = (id, events) => {
    const latest = events[events.length - 1];
    if (!latest) return null;
    if (latest.a === id) return latest.b;
    if (latest.b === id) return latest.a;
    return null;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '420px',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, rgba(30,15,50,0.5) 0%, rgba(5,2,10,0.95) 100%)',
        border: '1px solid rgba(201,168,76,0.25)',
      }}
    >
      {/* Interference text layer */}
      <AnimatePresence>
        {interferenceMsgs.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.5, x: `${msg.x}%`, y: `${msg.y}%` }}
            animate={{ opacity: [0, 0.65, 0.4, 0], x: `${msg.x + msg.dx}%`, y: `${msg.y + msg.dy}%` }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              fontSize: '18px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-display)',
              letterSpacing: '3px',
              color: 'rgba(255,255,255,0.7)',
              textShadow: '0 0 20px rgba(201,168,76,0.5)',
              zIndex: 20,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {msg.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {balls.map((ball) => {
          const swapTarget = getSwap(ball.id, collisionEvents);
          // Swap position if a collision just happened
          const shouldSwap = swapTarget !== null;
          const targetBall = shouldSwap ? balls.find(b => b.id === swapTarget) : null;

          // Smooth continuous wandering — gentle breathing scale, NO opacity flicker
          const scaleAnim = [1, 1.06, 1, 0.96, 1];
          // Animate left/top (percentage of PARENT container) so movement is correct
          const leftAnim = ball.xPath.map(p => `${ball.x + p * ball.xRange}%`);
          const topAnim = ball.yPath.map(p => `${ball.y + p * ball.yRange}%`);

          return (
            <motion.button
              key={ball.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: scaleAnim,
                left: leftAnim,
                top: topAnim,
              }}
              transition={{
                opacity: { duration: 0.5, delay: ball.id * 0.15 },
                scale: {
                  duration: 2.0 + ball.id * 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                },
                left: {
                  duration: ball.duration,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                },
                top: {
                  duration: ball.duration * 0.65,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                },
              }}
              exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
              whileHover={disabled ? {} : { scale: 1.15, transition: { duration: 0.15 } }}
              whileTap={disabled ? {} : { scale: 0.75, transition: { duration: 0.08 } }}
              onClick={() => !disabled && onCatch(ball.id)}
              disabled={disabled}
              style={{
                position: 'absolute',
                left: `${ball.x}%`,
                top: `${ball.y}%`,
                width: `${ball.size * 1.5}px`,
                height: `${ball.size * 1.5}px`,
                borderRadius: '50%',
                border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                background: 'transparent',
                padding: 0,
                transform: 'translate(-50%, -50%)',
                zIndex: 12,
                outline: 'none',
              }}
            >
              {/* Outer glow */}
              <motion.div
                animate={{ opacity: [0.35, 0.7, 0.35], scale: [1.0, 1.14, 1.0] }}
                transition={{ duration: 2.0 + ball.id, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: '-16px',
                  borderRadius: '50%',
                  background: blindMode
                    ? 'radial-gradient(circle, rgba(255,215,0,0.25) 0%, transparent 65%)'
                    : `radial-gradient(circle, ${ball.glow}18 0%, transparent 65%)`,
                  filter: 'blur(8px)',
                }}
              />

              {/* Mid glow */}
              <motion.div
                animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.92, 1.08, 0.92] }}
                transition={{ duration: 1.4 + ball.id * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '50%',
                  background: blindMode
                    ? 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 62%)'
                    : `radial-gradient(circle, ${ball.glow}38 0%, transparent 62%)`,
                  filter: 'blur(5px)',
                }}
              />

              {/* Core */}
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: `
                    radial-gradient(circle at 42% 38%, rgba(255,255,255,0.55) 0%, transparent 18%),
                    radial-gradient(circle at 50% 50%, ${ball.bg}cc 0%, ${ball.bg}66 38%, ${ball.bg}18 70%, transparent 100%)
                  `,
                  boxShadow: blindMode
                    ? `
                        inset 0 -4px 10px rgba(0,0,0,0.25),
                        0 0 24px rgba(255,215,0,0.6),
                        0 0 50px rgba(255,215,0,0.45),
                        0 0 80px rgba(255,215,0,0.2)
                      `
                    : `
                        inset 0 -4px 10px rgba(0,0,0,0.25),
                        0 0 20px ${ball.glow},
                        0 0 45px ${ball.glow}50,
                        0 0 72px ${ball.glow}18
                      `,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {blindMode ? (
                  // Blind mode: all orbs become identical glowing golden spheres
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      fontSize: ball.size > 70 ? '36px' : '28px',
                      filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.9)) drop-shadow(0 0 32px rgba(255,215,0,0.5))',
                      color: '#ffd700',
                    }}
                  >
                    ✦
                  </motion.div>
                ) : (
                  <motion.span
                    animate={{
                      textShadow: [
                        `0 0 10px rgba(255,255,255,0.9), 0 0 20px ${ball.bg}, 0 0 35px ${ball.bg}88, 0 0 50px ${ball.bg}55, 0 3px 6px rgba(0,0,0,0.7)`,
                        `0 0 14px rgba(255,255,255,1), 0 0 26px ${ball.bg}, 0 0 45px ${ball.bg}99, 0 0 65px ${ball.bg}66, 0 3px 6px rgba(0,0,0,0.7)`,
                        `0 0 10px rgba(255,255,255,0.9), 0 0 20px ${ball.bg}, 0 0 35px ${ball.bg}88, 0 0 50px ${ball.bg}55, 0 3px 6px rgba(0,0,0,0.7)`,
                      ],
                    }}
                    transition={{ duration: 1.5 + ball.id * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      color: '#fff',
                      fontSize: ball.size > 80 ? '17px' : ball.size > 70 ? '15px' : '14px',
                      fontWeight: '800',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      maxWidth: `${ball.size * 0.8}px`,
                      overflow: 'hidden',
                      letterSpacing: '1px',
                    }}
                  >
                    {ball.label.length > 6 ? ball.label.slice(0, 5) + '…' : ball.label}
                  </motion.span>
                )}
              </motion.div>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Collision flash */}
      {collisionEvents.map((ev) => (
        <motion.div
          key={ev.ts}
          initial={{ opacity: 0.8, scale: 0.5 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.4), transparent)',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 8,
          }}
        />
      ))}
    </div>
  );
}

// ========== Countdown ==========
function CountdownRing({ countdown, maxTime }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = countdown / maxTime;
  const offset = circumference * (1 - progress);
  const urgent = countdown <= 1;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '24px',
        padding: '16px 32px',
        background: urgent ? 'rgba(80,20,20,0.6)' : 'rgba(35,20,56,0.8)',
        borderRadius: '40px',
        border: urgent
          ? '1px solid rgba(248,113,113,0.4)'
          : '1px solid rgba(201,168,76,0.2)',
      }}
    >
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <motion.circle
          cx="28" cy="28" r={radius}
          fill="none"
          stroke={urgent ? '#f87171' : '#c9a84c'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.25, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 6px ${urgent ? '#f87171' : '#c9a84c'})` }}
        />
      </svg>
      <div style={{ textAlign: 'left' }}>
        <motion.div
          key={countdown}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-display)',
            color: urgent ? '#f87171' : '#e8d48b',
          }}
        >
          {urgent ? '!' : `${countdown}s`}
        </motion.div>
        <div
          style={{
            fontSize: '12px',
            color: urgent ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.4)',
            letterSpacing: '2px',
          }}
        >
          {urgent ? '快！手指动起来！' : '你来不及细想'}
        </div>
      </div>
    </div>
  );
}

// ========== Main ==========
export default function Game1_InstinctHand() {
  const [step, setStep] = useState('input');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [balls, setBalls] = useState([]);
  const [caught, setCaught] = useState(null);
  const [countdown, setCountdown] = useState(GAME_TIME);
  const [showResult, setShowResult] = useState(false);
  const [retriesLeft, setRetriesLeft] = useState(MAX_RETRIES);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [interferenceOn, setInterferenceOn] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [blindUnlocked, setBlindUnlocked] = useState(() => storage.get(BLIND_UNLOCK_KEY) || false);
  const [catchTime, setCatchTime] = useState(0);
  const startTimeRef = useRef(0);
  const countdownRef = useRef(null);
  const gameActive = useRef(false);

  const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
  const updateOption = (i, v) => { const n = [...options]; n[i] = v; setOptions(n); };
  const removeOption = (i) => { if (options.length > 2) setOptions(options.filter((_, j) => j !== i)); };

  // ---------- Build game state ----------
  const resetAndStartGame = () => {
    const validOpts = options.filter((o) => o.trim());
    if (validOpts.length < 2) return;

    const shuffled = [...validOpts].sort(() => Math.random() - 0.5);
    const count = shuffled.length;
    const edge = 14;

    // Distribute ball starting positions evenly across the stage
    const gridPositions = [];
    if (count === 2) {
      gridPositions.push({ x: 28, y: 50 }, { x: 72, y: 50 });
    } else if (count === 3) {
      gridPositions.push({ x: 25, y: 30 }, { x: 75, y: 30 }, { x: 50, y: 70 });
    } else if (count === 4) {
      gridPositions.push({ x: 28, y: 28 }, { x: 72, y: 28 }, { x: 28, y: 72 }, { x: 72, y: 72 });
    } else if (count === 5) {
      gridPositions.push({ x: 22, y: 22 }, { x: 78, y: 22 }, { x: 50, y: 50 }, { x: 22, y: 78 }, { x: 78, y: 78 });
    } else {
      gridPositions.push({ x: 22, y: 22 }, { x: 50, y: 18 }, { x: 78, y: 22 }, { x: 22, y: 78 }, { x: 50, y: 82 }, { x: 78, y: 78 });
    }

    const gameBalls = shuffled.map((opt, i) => {
      const pos = gridPositions[i];
      // Slight random offset so not perfectly rigid
      const bx = pos.x + (Math.random() - 0.5) * 12;
      const by = pos.y + (Math.random() - 0.5) * 12;
      // Max range capped so orb never exits the container
      const maxXRange = Math.min(bx - edge, 100 - edge - bx);
      const maxYRange = Math.min(by - edge, 100 - edge - by);
      // Target a large range, but never exceed the safe bound
      const xRange = Math.min(maxXRange, 35 + Math.random() * 25);
      const yRange = Math.min(maxYRange, 30 + Math.random() * 22);

      return {
        id: i,
        label: opt,
        x: bx,
        y: by,
        size: count <= 3 ? 90 : count <= 5 ? 76 : 64,
        color: ORB_COLORS[i % ORB_COLORS.length].bg,
        glow: ORB_COLORS[i % ORB_COLORS.length].glow,
        xRange,
        yRange,
        duration: 6.0 + Math.random() * 3.0 + i * 0.8,
        xPath: randomPath(),
        yPath: randomPath(),
      };
    });

    setBalls(gameBalls);
    setStep('playing');
    setCountdown(GAME_TIME);
    setCaught(null);
    setShowResult(false);
    setIsTimeUp(false);
    gameActive.current = true;
    startTimeRef.current = Date.now();
    setGameKey((k) => k + 1);
  };

  const startGame = () => {
    resetAndStartGame();
    setRetriesLeft(MAX_RETRIES);
    setBlindMode(false);
  };

  // ---------- Catch a ball ----------
  const catchBall = useCallback((id) => {
    if (!gameActive.current) return;
    const ball = balls.find((b) => b.id === id);
    if (ball) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setCatchTime(elapsed);
      setCaught(ball);
      setShowResult(true);
      gameActive.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);

      if (!blindUnlocked) {
        storage.set(BLIND_UNLOCK_KEY, true);
        setBlindUnlocked(true);
      }

      storage.addDiaryEntry({
        game: '本能之手',
        question,
        result: `${blindMode ? '[盲眼]' : ''}抓住了「${ball.label}」（${elapsed.toFixed(1)} 秒）`,
        type: 'instinct-hand',
      });
    }
  }, [balls, question, blindUnlocked, blindMode]);

  // ---------- Auto-catch on timeout ----------
  const autoCatch = useCallback(() => {
    if (!gameActive.current) return;
    gameActive.current = false;
    setIsTimeUp(true);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setCatchTime(elapsed);
    const randomBall = balls[Math.floor(Math.random() * balls.length)];
    if (randomBall) {
      setCaught(randomBall);
      setShowResult(true);

      if (!blindUnlocked) {
        storage.set(BLIND_UNLOCK_KEY, true);
        setBlindUnlocked(true);
      }

      storage.addDiaryEntry({
        game: '本能之手',
        question,
        result: `[超时自动]抓住了「${randomBall.label}」`,
        type: 'instinct-hand',
      });
    }
  }, [balls, question, blindUnlocked]);

  // ---------- Countdown ----------
  useEffect(() => {
    if (step !== 'playing') return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          autoCatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [step, gameKey, autoCatch]);

  // ---------- Retry: second attempt is forced blind mode ----------
  const retry = () => {
    if (retriesLeft <= 0) return;
    setRetriesLeft(retriesLeft - 1);
    // Second attempt = forced blind mode: system randomly picks
    setBlindMode(true);
    resetAndStartGame();
  };

  const goBackToInput = () => {
    setStep('input');
    setBalls([]);
    setBlindMode(false);
  };

  // ---------- Result copy ----------
  const quickResults = [
    `${catchTime.toFixed(1)} 秒。你甚至没读完另一个选项的完整描述——但手指已经替心做出了选择。`,
    `${catchTime.toFixed(1)} 秒，理性还没搭好舞台，本能已经谢了幕。`,
    '身体有时候，比心更诚实。',
    '你来不及算利弊，因为直觉从不算账。',
    '理性需要推演，本能只需要一眼。',
  ];
  const blindResults = [
    '在完全看不见的情况下，你的手依然伸向了它。你的潜意识，远比你以为的坚定。',
    '没有文字、没有标签——你只能相信手。而它没让你失望。',
    '盲眼之中，方向反而更清了。',
  ];
  const resultText = blindMode
    ? blindResults[Math.floor(Math.random() * blindResults.length)]
    : quickResults[Math.floor(Math.random() * quickResults.length)];

  // =====================================
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
            style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}
          >
            🤲
          </motion.span>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: '#e8d48b', letterSpacing: '4px' }}>
            本能之手
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
            在你理性还没上班时，本能已做了选择
          </p>
        </div>

        {/* Screen-edge red pulse — last 1 second */}
        {step === 'playing' && countdown <= 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
              boxShadow: 'inset 0 0 120px rgba(255,0,0,0.35), inset 0 0 60px rgba(255,0,0,0.2)',
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {/* ======== INPUT ======== */}
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
                你正在纠结什么？
              </label>
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="比如：该去大城市，还是留在家乡？"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', outline: 'none', marginBottom: '24px' }}
              />

              <label style={{ color: '#e8d48b', fontSize: '14px', letterSpacing: '2px', marginBottom: '12px', display: 'block' }}>
                你的选项（2-6个）
              </label>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="text" value={opt} onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`选项 ${i + 1}`}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)}
                      style={{ padding: '0 12px', borderRadius: '8px', background: 'rgba(192,57,43,0.2)', color: '#e74c3c', fontSize: '18px', border: 'none', cursor: 'pointer' }}>×</button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={addOption}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px dashed rgba(201,168,76,0.3)', fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}>
                  + 添加选项
                </button>
              )}

              {/* Interference toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                marginBottom: '16px', padding: '10px 16px',
                borderRadius: '8px', background: interferenceOn ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${interferenceOn ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                  干扰模式
                </span>
                <button
                  onClick={() => setInterferenceOn(!interferenceOn)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                    background: interferenceOn ? '#c9a84c' : 'rgba(255,255,255,0.12)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
                  }}
                >
                  <motion.div
                    animate={{ x: interferenceOn ? 20 : 2 }}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: 2 }}
                  />
                </button>
                {interferenceOn && (
                  <span style={{ fontSize: '11px', color: 'rgba(201,168,76,0.7)' }}>
                    大脑会干扰你，手指不会
                  </span>
                )}
              </div>

              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                {GAME_TIME} 秒倒计时 · 第一次自由抓取 · 第二次为盲眼随机
              </p>

              <button onClick={startGame}
                disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px', marginTop: '20px',
                  background: question.trim() && options.filter((o) => o.trim()).length >= 2
                    ? 'linear-gradient(135deg, #c9a84c, #e8d48b)' : 'rgba(255,255,255,0.1)',
                  color: question.trim() && options.filter((o) => o.trim()).length >= 2 ? '#1a0a2e' : 'rgba(255,255,255,0.3)',
                  fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', border: 'none',
                  cursor: question.trim() && options.filter((o) => o.trim()).length >= 2 ? 'pointer' : 'not-allowed',
                }}>
                伸出手，抓住你的答案
              </button>
            </motion.div>
          )}

          {/* ======== PLAYING ======== */}
          {step === 'playing' && (
            <motion.div key={`playing-${gameKey}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '12px' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', letterSpacing: '2px' }}>
                  {blindMode
                    ? '此轮为盲眼模式——光团不再显示文字，由你的直觉决定一切'
                    : '选项都在眼前，但你来不及细细掂量。相信第一眼的冲动。'}
                </p>
              </motion.div>

              <OrbBalls
                balls={balls}
                onCatch={catchBall}
                disabled={!gameActive.current}
                blindMode={blindMode}
                showInterference={interferenceOn}
              />

              {!showResult && (
                <div style={{ textAlign: 'center' }}>
                  <CountdownRing countdown={countdown} maxTime={GAME_TIME} />
                </div>
              )}
            </motion.div>
          )}

          {/* ======== RESULT ======== */}
          {step === 'playing' && showResult && caught && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              style={{ textAlign: 'center', padding: '40px', background: 'rgba(35,20,56,0.9)', borderRadius: '16px', border: '2px solid #c9a84c', marginTop: '24px' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                style={{
                  width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 24px',
                  background: `radial-gradient(circle at 35% 35%, ${caught.color || '#c9a84c'}, ${caught.color || '#c9a84c'}88 50%, ${caught.color || '#c9a84c'}22 100%)`,
                  boxShadow: `0 0 40px ${caught.glow || 'rgba(201,168,76,0.5)'}, 0 0 80px ${caught.glow || 'rgba(201,168,76,0.3)'}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}
              >
                <div style={{ width: '30%', height: '30%', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', position: 'absolute', top: '20%', left: '22%', filter: 'blur(2px)' }} />
              </motion.div>

              <h3 style={{ fontSize: '20px', color: '#e8d48b', letterSpacing: '2px', marginBottom: '8px' }}>
                {isTimeUp ? '⏰ 时间到了，光替你选了 ——' : `✨ 你抓住了 ——`}
              </h3>

              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', padding: '16px 32px', background: 'rgba(201,168,76,0.1)', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
                {caught.label}
              </div>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', fontStyle: 'italic', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.7 }}
              >
                {resultText}
              </motion.p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {retriesLeft > 0 ? (
                  <button onClick={retry}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      background: blindUnlocked ? 'rgba(255,215,0,0.18)' : 'rgba(201,168,76,0.2)',
                      color: blindUnlocked ? '#ffd700' : '#c9a84c',
                      border: blindUnlocked ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(201,168,76,0.3)',
                      fontSize: '14px', cursor: 'pointer',
                    }}>
                    {blindUnlocked ? '🥚 盲眼随机再抽一次' : '再抓一次'}
                  </button>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', width: '100%' }}>
                    两轮已满。命运给的两个答案，都值得看一看。
                  </p>
                )}

                <button onClick={goBackToInput}
                  style={{ padding: '12px 28px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px', cursor: 'pointer' }}>
                  换一批选项重新来
                </button>
              </div>

              {blindUnlocked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    marginTop: '20px', padding: '16px 20px',
                    borderRadius: '10px', background: 'rgba(255,215,0,0.06)',
                    border: '1px solid rgba(255,215,0,0.12)',
                    fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                    fontStyle: 'italic',
                  }}
                >
                  盲眼模式下，所有光团长得一模一样。<br />
                  在你完全不知道的情况下——你的手，仍然会伸向某个方向。
                </motion.div>
              )}

              <InsightPanel
                gameType="instinct-hand"
                visible={true}
                context={{
                  question,
                  options: options.filter((o) => o.trim()).join('、'),
                  result: caught?.label || '',
                  time: catchTime.toFixed(1) + '秒',
                  blindMode,
                  isTimeout: isTimeUp,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
