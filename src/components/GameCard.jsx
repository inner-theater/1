import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const cardColors = [
  'linear-gradient(135deg, #3d1259 0%, #6b21a8 100%)',
  'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
  'linear-gradient(135deg, #5c1a1a 0%, #c0392b 100%)',
  'linear-gradient(135deg, #1a3a2a 0%, #059669 100%)',
  'linear-gradient(135deg, #3a2a1a 0%, #d97706 100%)',
];

const icons = ['🤲', '💌', '🔮', '🃏', '⚖️'];

export default function GameCard({ game, index, delay = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: delay + index * 0.12,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        boxShadow: '0 20px 60px rgba(201, 168, 76, 0.3)',
        transition: { duration: 0.3 },
      }}
      onClick={() => navigate(game.path)}
      style={{
        background: cardColors[index % cardColors.length],
        borderRadius: '16px',
        padding: '32px 24px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(201, 168, 76, 0.2)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Decorative corner */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '80px', height: '80px',
        background: 'radial-gradient(circle at top right, rgba(201,168,76,0.15), transparent 70%)',
      }} />

      {/* Icon */}
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
      }}>
        {icons[index % icons.length]}
      </div>

      {/* Stage number */}
      <div style={{
        fontSize: '12px',
        color: '#c9a84c',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '8px',
        fontFamily: 'var(--font-display)',
      }}>
        第{game.scene}幕 · {game.act}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '24px',
        fontFamily: 'var(--font-display)',
        color: '#fff',
        marginBottom: '8px',
        letterSpacing: '2px',
      }}>
        {game.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '13px',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.6,
        marginBottom: '16px',
        minHeight: '42px',
      }}>
        {game.description}
      </p>

      {/* Badge */}
      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        background: 'rgba(201,168,76,0.15)',
        color: '#e8d48b',
        border: '1px solid rgba(201,168,76,0.3)',
      }}>
        {game.duration}
      </div>
    </motion.div>
  );
}
