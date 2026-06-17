import { motion, AnimatePresence } from 'framer-motion';

export default function CurtainOverlay({ isOpen, children }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatePresence>
        {!isOpen && (
          <>
            {/* Left curtain */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '50vw',
                height: '100vh',
                background: 'linear-gradient(90deg, #1a0a2e 0%, #3d1259 50%, #231438 100%)',
                zIndex: 1000,
                borderRight: '4px solid #c9a84c',
              }}
            >
              <div style={{
                width: '100%', height: '100%',
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 12px,
                  rgba(0,0,0,0.1) 12px,
                  rgba(0,0,0,0.1) 14px
                )`,
              }} />
            </motion.div>
            {/* Right curtain */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '50vw',
                height: '100vh',
                background: 'linear-gradient(270deg, #1a0a2e 0%, #3d1259 50%, #231438 100%)',
                zIndex: 1000,
                borderLeft: '4px solid #c9a84c',
              }}
            >
              <div style={{
                width: '100%', height: '100%',
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 12px,
                  rgba(0,0,0,0.1) 12px,
                  rgba(0,0,0,0.1) 14px
                )`,
              }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
