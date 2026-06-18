import { motion } from 'framer-motion';
import { MALE_AVATARS, FEMALE_AVATARS } from '../utils/profile';

export default function AvatarSelector({ gender, selected, onSelect }) {
  const avatars = gender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '10px',
    }}>
      {avatars.map((av) => (
        <motion.button
          key={av.id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(av.id)}
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${av.bg[0]}, ${av.bg[1]})`,
            border: selected === av.id ? '3px solid #e8d48b' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px',
            transition: 'border 0.2s',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: '28px' }}>{av.emoji}</span>
          <span style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 'bold',
          }}>
            {av.label}
          </span>
          {selected === av.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#e8d48b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#1a0a2e',
              }}
            >
              ✓
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
