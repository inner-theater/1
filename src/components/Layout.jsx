import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ParticleBackground from './ParticleBackground';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isHome = location.pathname === '/';
  const hideHeader = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <ParticleBackground />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(201,168,76,0.15)',
          background: 'rgba(26,10,46,0.8)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <span style={{ fontSize: '28px' }}>🎭</span>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontFamily: 'var(--font-display)',
              color: '#e8d48b',
              letterSpacing: '4px',
              lineHeight: 1.2,
            }}>
              内心剧场
            </h1>
            <p style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '2px',
            }}>
              THE INNER THEATER
            </p>
          </div>
        </Link>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {!hideHeader && (<>
          <Link
            to="/"
            style={{
              color: isHome ? '#e8d48b' : 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              letterSpacing: '2px',
              transition: 'color 0.3s',
            }}
          >
            剧场大厅
          </Link>
          <Link
            to="/diary"
            style={{
              color: location.pathname === '/diary' ? '#e8d48b' : 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              letterSpacing: '2px',
              transition: 'color 0.3s',
            }}
          >
            决策日记
          </Link>
          <Link
            to="/museum"
            style={{
              color: location.pathname === '/museum' ? '#e8d48b' : 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              letterSpacing: '2px',
              transition: 'color 0.3s',
            }}
          >
            人生博物馆
          </Link>

          {user ? (
            <button onClick={signOut}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              👤 {user.email?.split('@')[0]} · 退出
            </button>
          ) : (
            <Link to="/login"
              style={{
                color: 'rgba(201,168,76,0.8)',
                fontSize: '13px',
                letterSpacing: '2px',
              }}
            >
              登录
            </Link>
          )}
          </>)}
        </nav>
      </motion.header>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 77px)' }}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '32px',
        borderTop: '1px solid rgba(201,168,76,0.1)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px',
        letterSpacing: '2px',
      }}>
        <p>🎭 内心剧场 · 听见你心底的声音</p>
      </footer>
    </div>
  );
}
