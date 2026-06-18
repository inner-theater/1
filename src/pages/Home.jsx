import { motion } from 'framer-motion';
import GameCard from '../components/GameCard';

const games = [
  {
    path: '/game/instinct-hand',
    title: '本能之手',
    scene: '一',
    act: '直觉剧场',
    description: '让光球替你选择——在5秒内抓住那个命中注定的答案',
    duration: '约 2 分钟',
    icon: '🤲',
  },
  {
    path: '/game/reverse-fear',
    title: '反向恐惧清单',
    scene: '一',
    act: '直觉剧场',
    description: '逐一删去你害怕的结果，最后留下的就是你的底线',
    duration: '约 3 分钟',
    icon: '🎭',
  },
  {
    path: '/game/parallel-letters',
    title: '平行时空来信',
    scene: '二',
    act: '情感剧场',
    description: 'AI为你写下不同选择后的未来信件，触碰那些被忽略的情感',
    duration: '约 5 分钟',
    icon: '✉️',
  },
  {
    path: '/game/friend-room',
    title: '朋友灵魂拷问室',
    scene: '二',
    act: '情感剧场',
    description: '让朋友通过古怪问题，帮你照见自己都没发现的内心答案',
    duration: '约 5 分钟',
    icon: '🔮',
  },
  {
    path: '/game/value-auction',
    title: '价值天平拍卖会',
    scene: '三',
    act: '理性剧场',
    description: '用100枚金币竞拍你最珍视的价值，让理性为你导航',
    duration: '约 4 分钟',
    icon: '⚖️',
  },
  {
    path: '/game/personality-test',
    title: '人格测试',
    scene: '三',
    act: '理性剧场',
    description: '基于大五人格模型，25道题生成专属人格画像卡片',
    duration: '约 3 分钟',
    icon: '🧬',
  },
];

export default function Home() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: 'center',
          padding: '80px 0 60px',
        }}
      >
        <div style={{
          display: 'inline-block',
          width: '100px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          marginBottom: '24px',
        }} />
        <h2 style={{
          fontSize: '42px',
          fontFamily: 'var(--font-display)',
          color: '#e8d48b',
          letterSpacing: '6px',
          marginBottom: '16px',
        }}>
          欢迎来到内心剧场
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.8,
        }}>
          我们不为你的纠结提供答案<br />
          而是帮你听见自己心底早已存在的声音
        </p>
        <div style={{
          display: 'inline-block',
          width: '100px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          marginTop: '24px',
        }} />
      </motion.div>

      {/* Three Acts */}
      {['第一幕：直觉剧场', '第二幕：情感剧场', '第三幕：理性剧场'].map((actTitle, actIndex) => {
        const actGames = games.filter((g) => {
          if (actIndex === 0) return ['/game/instinct-hand', '/game/reverse-fear'].includes(g.path);
          if (actIndex === 1) return ['/game/parallel-letters', '/game/friend-room'].includes(g.path);
          return ['/game/value-auction', '/game/personality-test'].includes(g.path);
        });

        return (
          <motion.div
            key={actTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + actIndex * 0.2, duration: 0.6 }}
            style={{ marginBottom: '48px' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '32px',
                height: '1px',
                background: '#c9a84c',
              }} />
              <h3 style={{
                fontSize: '18px',
                fontFamily: 'var(--font-display)',
                color: '#e8d48b',
                letterSpacing: '4px',
              }}>
                {actTitle}
              </h3>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'rgba(201,168,76,0.15)',
              }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${actGames.length === 1 ? 1 : 2}, 1fr)`,
              gap: '24px',
            }}>
              {actGames.map((game, idx) => (
                <GameCard
                  key={game.path}
                  game={game}
                  index={idx}
                  delay={0.5 + actIndex * 0.2}
                />
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Bottom spacer */}
      <div style={{ height: '40px' }} />
    </div>
  );
}
